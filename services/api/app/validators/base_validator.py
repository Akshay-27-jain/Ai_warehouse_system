from marshmallow import Schema, fields, validate, ValidationError


class BaseValidator:
    @staticmethod
    def validate_payload(schema: Schema, payload: dict):
        errors = schema.load(payload)
        return errors
