# backend/eis_apps/administration/management/commands/seed_landing_components.py
from django.core.management.base import BaseCommand
from eis_apps.administration.models import BlockType, LandingPageSection

class Command(BaseCommand):
    help = 'Seeds BlockTypes and LandingPageSections'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Dynamic Landing Page Components...")

        # Block Types (from BlockBuilder.jsx)
        BLOCK_TYPES = [
            { "id": 'bar_chart',     "label": 'Bar Chart',            "icon": '📊', "category": 'chart',   "desc": 'Compare values across categories using vertical or horizontal bars.',    "color": '#6366f1' },
            { "id": 'line_chart',    "label": 'Line / Area Chart',    "icon": '📈', "category": 'chart',   "desc": 'Show trends over time with connected data points or filled areas.',       "color": '#0284c7' },
            { "id": 'pie_chart',     "label": 'Pie / Donut Chart',    "icon": '🍩', "category": 'chart',   "desc": 'Show part-to-whole relationships as segments of a circle.',              "color": '#7c3aed' },
            { "id": 'scatter_chart', "label": 'Scatter Plot',          "icon": '✦',  "category": 'chart',   "desc": 'Explore correlations between two numeric variables.',                    "color": '#0891b2' },
            { "id": 'sankey_viz',    "label": 'Sankey / Flow',         "icon": '🌊', "category": 'chart',   "desc": 'Visualise energy flows between sources and destinations.',               "color": '#0d9488' },
            { "id": 'map_viz',       "label": 'Bhutan Dzongkhag Map', "icon": '🗺️', "category": 'geo',    "desc": 'Choropleth map showing data per dzongkhag from the database.',           "color": '#2d8a5e' },
            { "id": 'data_table',    "label": 'Data Table',            "icon": '📋', "category": 'table',   "desc": 'Structured data rows and columns with sorting and filtering.',           "color": '#374151' },
            { "id": 'stat_cards',    "label": 'Stat / KPI Cards',      "icon": '🔢', "category": 'content', "desc": 'Key performance indicators as large highlighted number cards.',          "color": '#b45309' },
            { "id": 'rich_text',     "label": 'Rich Text Block',       "icon": '📝', "category": 'content', "desc": 'Paragraphs, headings and formatted text content.',                       "color": '#374151' },
            { "id": 'banner',        "label": 'CTA Banner',            "icon": '🏷️', "category": 'content', "desc": 'Full-width call-to-action banner with a button.',                       "color": '#1a4a3a' },
            { "id": 'feature_grid',  "label": 'Feature Card Grid',     "icon": '🃏', "category": 'content', "desc": 'Grid of icon cards highlighting features or sectors.',                  "color": '#4f46e5' },
        ]

        # Sections (from LandingPageEditor.jsx)
        ALL_SECTIONS = [
            { "id": 'hero',         "name": 'Hero Slideshow',              "icon": '🎥', "desc": 'Full-screen hero with image slider & CTA buttons', "color": '#6366f1' },
            { "id": 'map',          "name": 'Bhutan Energy by Dzongkhag',  "icon": '🗺️', "desc": 'Interactive SVG map of all 20 dzongkhags with hover data', "color": '#2d8a5e' },
            { "id": 'sankey',       "name": 'Energy Sankey Diagram',       "icon": '📊', "desc": 'Energy flow ribbons from primary supply to final consumption', "color": '#0284c7' },
            { "id": 'trends',       "name": 'Energy Trends 2010–2022',     "icon": '📈', "desc": 'Historical area & bar charts with year selector', "color": '#b45309' },
            { "id": 'sectors',      "name": 'All Energy Sectors',          "icon": '⚡', "desc": '9-sector card grid covering all energy streams', "color": '#7c3aed' },
            { "id": 'open_data',    "name": 'Open Data / Public Cards',    "icon": '📂', "desc": 'Dashboard, Energy Balance & Reports quick-access cards', "color": '#0891b2' },
            { "id": 'integrations', "name": 'Integrated Gov Systems',      "icon": '🔗', "desc": 'NDI, FIRMS, eRALIS, MAS, IIS, OFS logo grid', "color": '#374151' },
            { "id": 'faqs',         "name": 'FAQ Accordion',               "icon": '❓', "desc": 'Collapsible questions & answers section', "color": '#4f46e5' },
            { "id": 'cta',          "name": 'Login / CTA Banner',          "icon": '🔒', "desc": 'Dark call-to-action with portal login button', "color": '#1a4a3a' },
        ]

        for idx, item in enumerate(BLOCK_TYPES):
            BlockType.objects.update_or_create(
                id=item['id'],
                defaults={
                    'label': item['label'],
                    'icon': item['icon'],
                    'category': item['category'],
                    'desc': item['desc'],
                    'color': item['color']
                }
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(BLOCK_TYPES)} BlockTypes"))

        for idx, item in enumerate(ALL_SECTIONS):
            LandingPageSection.objects.update_or_create(
                id=item['id'],
                defaults={
                    'name': item['name'],
                    'icon': item['icon'],
                    'desc': item['desc'],
                    'color': item['color'],
                    'order': idx * 10
                }
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(ALL_SECTIONS)} LandingPageSections"))
