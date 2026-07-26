from flask import jsonify


def success_response(data=None, message='Success', status=200):
    payload = {'message': message}
    if data is not None:
        payload['data'] = data
    return jsonify(payload), status


def error_response(message='Error', status=400, errors=None):
    payload = {'error': message}
    if errors:
        payload['errors'] = errors
    return jsonify(payload), status
