from fastapi import APIRouter

router = APIRouter()


# --- Documents ---

@router.get("/documents")
async def list_documents(page: int = 1, page_size: int = 20, search: str | None = None):
    """文档列表 (分页 + 搜索)"""
    # TODO: implement with SQLAlchemy
    return {"data": [], "total": 0, "page": page, "page_size": page_size}


@router.post("/documents", status_code=201)
async def create_document(title: str, content: str, tags: list[str] | None = None):
    """创建文档"""
    # TODO: implement
    return {"id": "doc_placeholder", "message": "created"}


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """获取文档详情"""
    # TODO: implement
    return {"id": doc_id, "title": "", "content": "", "tags": []}


@router.put("/documents/{doc_id}")
async def update_document(doc_id: str, title: str | None = None, content: str | None = None):
    """更新文档"""
    # TODO: implement
    return {"message": "updated"}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """删除文档"""
    # TODO: implement
    return {"message": "deleted"}


# --- Search ---

@router.post("/search/semantic")
async def semantic_search(query: str, top_k: int = 10):
    """语义搜索"""
    # TODO: implement with Milvus
    return {"results": [], "query": query}


@router.get("/search/fulltext")
async def fulltext_search(q: str, page: int = 1, page_size: int = 20):
    """全文搜索"""
    # TODO: implement with Elasticsearch
    return {"results": [], "total": 0}


# --- Tags ---

@router.get("/tags")
async def list_tags():
    """获取所有标签"""
    # TODO: implement
    return {"tags": []}
