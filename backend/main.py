"""
=============================================================
  SERVER METRICS — BACKEND STUB

  Задача: заполнить все TODO, не менять сигнатуры и схемы.
  Запуск: uvicorn main:app --reload --port 3001
=============================================================
"""

import asyncio
import random
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import re


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class ServerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=30)
    ip: str
    type: Literal["physical", "virtual", "container"]

    @field_validator("ip")
    @classmethod
    def validate_ip(cls, v: str) -> str:
        pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid IPv4 address")
        parts = v.split(".")
        if any(int(p) > 255 for p in parts):
            raise ValueError("Invalid IPv4 address")
        return v


class ServerUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=30)


class Server(BaseModel):
    id: str
    name: str
    ip: str
    type: Literal["physical", "virtual", "container"]


class MetricPoint(BaseModel):
    server_id: str
    cpu: float
    memory: float
    timestamp: str


# ─── In-memory storage ───────────────────────────────────────────────────────

db: dict[str, Server] = {}
active_connections: list[WebSocket] = []

def init_db():
    prefixes = ["web", "app", "db", "cache", "api", "worker", "queue"]
    types = ["physical", "virtual", "container"]
    count = random.randint(3, 5)
    used_ips = set()
    for _ in range(count):
        name = f"{random.choice(prefixes)}-{random.randint(1, 99)}"
        ip = f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}"
        while ip in used_ips:
            ip = f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}"
        used_ips.add(ip)
        stype = random.choice(types)
        sid = uuid.uuid4().hex[:12]
        db[sid] = Server(id=sid, name=name, ip=ip, type=stype)


# ─── WebSocket helpers ───────────────────────────────────────────────────────

async def broadcast(message: dict) -> None:
    dead: list[WebSocket] = []
    for ws in active_connections:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections.remove(ws)



async def metrics_loop() -> None:
    try:
        while True:
            await asyncio.sleep(2)
            for sid in list(db.keys()):
                point = MetricPoint(
                    server_id=sid,
                    cpu=round(random.uniform(0, 95), 1),
                    memory=round(random.uniform(10, 90), 1),
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
                await broadcast({"type": "metrics", "payload": point.model_dump()})
    except asyncio.CancelledError:
        pass



# ─── Lifespan (запуск/остановка фоновых задач) ───────────────────────────────
# asynccontextmanager: всё до yield — startup, всё после — shutdown.

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(metrics_loop())  # запуск фоновой задачи
    yield
    task.cancel()  # остановка при выключении сервера


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Server Metrics API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── REST endpoints ──────────────────────────────────────────────────────────

@app.get("/api/servers", response_model=list[Server])
async def list_servers():
    return list(db.values())


@app.post("/api/servers", response_model=Server, status_code=201)
async def create_server(body: ServerCreate):
    sid = uuid.uuid4().hex[:12]
    server = Server(id=sid, name=body.name, ip=body.ip, type=body.type)
    db[sid] = server
    return server



@app.put("/api/servers/{server_id}", response_model=Server)
async def update_server(server_id: str, body: ServerUpdate):
    if server_id not in db:
        raise HTTPException(404, detail="Сервер не найден")
    db[server_id].name = body.name
    return db[server_id]


@app.delete("/api/servers/{server_id}", status_code=204)
async def delete_server(server_id: str):
    if server_id not in db:
        raise HTTPException(404, detail="Сервер не найден")
    del db[server_id]
    await broadcast({"type": "server_removed", "payload": {"serverId": server_id}})



# ─── WebSocket ───────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

