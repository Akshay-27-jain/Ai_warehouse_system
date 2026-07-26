from marshmallow import Schema, ValidationError, fields, validate
from marshmallow.decorators import pre_load


class RegisterSchema(Schema):
    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=80))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=80))


class LoginSchema(Schema):
    identifier = fields.String(load_default=None)
    username = fields.String(load_default=None)
    password = fields.String(required=True)

    @pre_load
    def normalize_identifier(self, data, **kwargs):
        if not data.get('identifier') and data.get('username'):
            data['identifier'] = data['username']
        return data

    def validate(self, data, *, many=None, partial=None):
        result = super().validate(data, many=many, partial=partial)
        if not data.get('identifier'):
            raise ValidationError({'identifier': ['Identifier or username is required.']})
        return result


class ForgotPasswordSchema(Schema):
    email = fields.String(required=True, validate=validate.Length(min=1))


class ResetPasswordSchema(Schema):
    token = fields.String(required=True)
    password = fields.String(required=True)
