"""
Patches the Unfold _flatten_context bug for Django 5 + Unfold 0.84.0
Run: venv\Scripts\python.exe fix_unfold.py
"""
import os, sys

unfold_path = None
for path in sys.path:
    p = os.path.join(path, "unfold", "templatetags", "unfold.py")
    if os.path.exists(p):
        unfold_path = p
        break

if not unfold_path:
    print("ERROR: Could not find unfold templatetags.")
    sys.exit(1)

print(f"Found: {unfold_path}")

with open(unfold_path, "r", encoding="utf-8") as f:
    content = f.read()

OLD = '''def _flatten_context(context: Context) -> dict[str, Any]:
    """
    Return the template context as a single flat dict.
    On Django < 5, context.flatten() can raise ValueError for contexts
    created with context.new() (Django #35417). Use a safe implementation.
    """
    if DJANGO_VERSION >= (5, 0):
        return context.flatten()
    # TODO: remove once Django 4.2 is not supported
    # Django 4.2: build flat dict by resolving keys, avoid context.flatten()
    keys = set()
    for d in context.dicts:
        if hasattr(d, "keys"):
            keys.update(d.keys())
    return {k: context[k] for k in keys}'''

NEW = '''def _flatten_context(context: Context) -> dict[str, Any]:
    """
    Return the template context as a single flat dict.
    On Django < 5, context.flatten() can raise ValueError for contexts
    created with context.new() (Django #35417). Use a safe implementation.
    Patched: guard against non-dict items in context.dicts (fieldset tuples).
    """
    if DJANGO_VERSION >= (5, 0):
        # context.dicts can contain non-dict items (e.g. fieldset tuples)
        # when certain admin pages are rendered. Safe implementation:
        flat = {}
        for d in context.dicts:
            if isinstance(d, dict):
                flat.update(d)
        return flat
    # TODO: remove once Django 4.2 is not supported
    # Django 4.2: build flat dict by resolving keys, avoid context.flatten()
    keys = set()
    for d in context.dicts:
        if hasattr(d, "keys"):
            keys.update(d.keys())
    return {k: context[k] for k in keys}'''

if OLD in content:
    content = content.replace(OLD, NEW)
    with open(unfold_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Patched successfully! Restart Django: python manage.py runserver")
else:
    print("ERROR: Could not find exact function text to replace.")
    print("The function may have changed. Manual edit needed.")
    print(f"\nOpen: {unfold_path}")
    print("\nFind this line:")
    print("    if DJANGO_VERSION >= (5, 0):")
    print("        return context.flatten()")
    print("\nReplace those 2 lines with:")
    print("    if DJANGO_VERSION >= (5, 0):")
    print("        flat = {}")
    print("        for d in context.dicts:")
    print("            if isinstance(d, dict):")
    print("                flat.update(d)")
    print("        return flat")