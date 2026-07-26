from app.extensions import db
from app.repositories.base_repository import BaseRepository
from datetime import date, datetime
from decimal import Decimal


class CRUDService:
    def __init__(self, repository: BaseRepository):
        self.repository = repository

    def list(self, filters=None, sort_by=None, sort_desc=False, page=1, per_page=20):
        items, total, pages = self.repository.get_all(filters=filters, sort_by=sort_by, sort_desc=sort_desc, page=page, per_page=per_page)
        return {
            'items': [self.serialize(item) for item in items],
            'total': total,
            'pages': pages,
            'page': page,
            'per_page': per_page,
        }

    def get(self, id_):
        item = self.repository.get_by_id(id_)
        if not item:
            raise ValueError('Not found')
        return self.serialize(item)

    def create(self, payload: dict):
        item = self.repository.create(payload)
        return self.serialize(item)

    def update(self, id_, payload: dict):
        item = self.repository.get_by_id(id_)
        if not item:
            raise ValueError('Not found')
        updated_item = self.repository.update(item, payload)
        return self.serialize(updated_item)

    def delete(self, id_):
        item = self.repository.get_by_id(id_)
        if not item:
            raise ValueError('Not found')
        self.repository.delete(item)
        return {'deleted': True}

    def serialize(self, item):
        data = {}
        for column in item.__table__.columns:
            value = getattr(item, column.name)
            if isinstance(value, (datetime, date)):
                value = value.isoformat()
            elif isinstance(value, Decimal):
                value = float(value)
            data[column.name] = value
        return data
