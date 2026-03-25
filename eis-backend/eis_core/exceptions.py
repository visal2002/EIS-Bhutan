from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "error": {
                "status_code": response.status_code,
                "detail": response.data,
            }
        }
    return response


class EISValidationError(Exception):
    """Raised when EIS business rule validation fails."""
    def __init__(self, message, code=None):
        self.message = message
        self.code = code
        super().__init__(message)


class ExternalAPIError(Exception):
    """Raised when an external system API call fails."""
    def __init__(self, system, message):
        self.system = system
        self.message = message
        super().__init__(f"{system}: {message}")