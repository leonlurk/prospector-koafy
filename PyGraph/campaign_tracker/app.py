from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from firebase_client import FirebaseClient
from campaign_service import CampaignService

app = FastAPI(title="Campaign Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen para desarrollo
    allow_credentials=False,  # Cambia a False si usas allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar cliente Firebase
firebase = FirebaseClient()

@app.get("/campaign/{user_id}/{campaign_id}/progress")
async def get_campaign_progress(user_id: str, campaign_id: str):
    logger.info(f"Solicitud de progreso para - User ID: {user_id}, Campaign ID: {campaign_id}")
    
    campaign = firebase.get_campaign(user_id, campaign_id)
    if not campaign:
        logger.error(f"Campaña no encontrada - User ID: {user_id}, Campaign ID: {campaign_id}")
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    logger.info(f"Datos de la campaña obtenidos de Firebase: {campaign}")
    
    progress_data = CampaignService.calculate_progress(campaign)
    logger.info(f"Datos de progreso calculados: {progress_data}")
    
    result = {
        "percentage": progress_data.percentage,
        "completed_batches": progress_data.completed_batches,
        "messages_sent": progress_data.messages_sent,
        "next_batch_in": progress_data.next_batch_in,
        "time_elapsed": progress_data.time_elapsed,
        "batch_progress": progress_data.batch_progress,
        "estimated_completion": progress_data.estimated_completion_time.isoformat() if progress_data.estimated_completion_time else None
    }
    
    logger.info(f"Respuesta enviada al cliente: {result}")
    return result

@app.get("/campaign/{user_id}/{campaign_id}/chart")
async def get_campaign_chart(user_id: str, campaign_id: str):
    logger.info(f"Solicitud de datos de gráfico para - User ID: {user_id}, Campaign ID: {campaign_id}")
    
    campaign = firebase.get_campaign(user_id, campaign_id)
    if not campaign:
        logger.error(f"Campaña no encontrada - User ID: {user_id}, Campaign ID: {campaign_id}")
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    logger.info(f"Datos de la campaña obtenidos de Firebase: {campaign}")
    
    chart_data = CampaignService.generate_chart_data(campaign)
    logger.info(f"Datos de gráfico generados: {chart_data}")
    
    result = {
        "points": [{"hour": p.hour, "messages": p.messages, "is_current": p.is_current} for p in chart_data.points],
        "total_hours": chart_data.total_hours,
        "total_messages": chart_data.total_messages
    }
    
    logger.info(f"Respuesta enviada al cliente: {result}")
    return result

# Ruta raíz para verificar que la API está funcionando
@app.get("/")
async def root():
    return {"message": "Campaign Tracker API está funcionando"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)