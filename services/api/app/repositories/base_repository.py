from typing import Any, Optional
from app.extensions import db
from sqlalchemy import or_


class BaseRepository:
    model = None

    def get_all(self, filters=None, sort_by=None, sort_desc=False, page=1, per_page=20):
        query = self.model.query
        if filters:
            # support a special free-text 'q' filter that searches across textual columns
            q = filters.get('q')
            if q:
                q = str(q)
                ors = []
                for col in getattr(self.model, '__table__').columns:
                    try:
                        attr = getattr(self.model, col.name)
                        # only apply ilike on textual columns
                        if hasattr(attr, 'ilike'):
                            ors.append(attr.ilike(f'%{q}%'))
                    except Exception:
                        continue
                # also allow numeric id match when query is numeric
                if q.isdigit() and hasattr(self.model, 'id'):
                    try:
                        ors.append(getattr(self.model, 'id') == int(q))
                    except Exception:
                        pass
                if ors:
                    query = query.filter(or_(*ors))

            # apply field-specific filters
            for field, value in filters.items():
                if field == 'q' or value is None:
                    continue
                if hasattr(self.model, field):
                    attr = getattr(self.model, field)
                    if hasattr(attr, 'ilike'):
                        query = query.filter(attr.ilike(f'%{value}%'))
                    else:
                        query = query.filter(attr == value)
        if sort_by and hasattr(self.model, sort_by):
            column = getattr(self.model, sort_by)
            query = query.order_by(column.desc() if sort_desc else column.asc())
        else:
            query = query.order_by(self.model.id.asc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return pagination.items, pagination.total, pagination.pages

    def get_by_id(self, id_: int) -> Optional[Any]:
        return self.model.query.get(id_)

    def create(self, data: dict) -> Any:
        instance = self.model(**data)
        db.session.add(instance)
        db.session.commit()
        return instance

    def update(self, instance: Any, data: dict) -> Any:
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        db.session.commit()
        return instance

    def delete(self, instance: Any) -> None:
        db.session.delete(instance)
        db.session.commit()
