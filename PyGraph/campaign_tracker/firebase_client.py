import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
from models import Campaign
import os
import logging

logger = logging.getLogger(__name__)

class FirebaseClient:
    def __init__(self):
        # Ruta al archivo de credenciales
        current_dir = os.path.dirname(os.path.abspath(__file__))
        credentials_path = os.path.join(current_dir, "koafy-5bbb8-firebase-adminsdk-fbsvc-b7c718e1b8.json")
        
        logger.info(f"Inicializando cliente Firebase con credenciales en: {credentials_path}")
        
        cred = credentials.Certificate(credentials_path)
        
        # Check if the app is already initialized
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado correctamente")
        else:
            logger.info("Firebase ya estaba inicializado")
        
        self.db = firestore.client()
    
    def get_campaign(self, user_id, campaign_id):
            try:
                doc_ref = self.db.collection('users').document(user_id).collection('campaigns').document(campaign_id)
                doc = doc_ref.get()
                
                if not doc.exists:
                    return None
                
                data = doc.to_dict()
                
                # Convertir timestamp a datetime
                created_at = data.get('createdAt')
                if created_at:
                    try:
                        if hasattr(created_at, 'timestamp'):
                            created_at = datetime.fromtimestamp(created_at.timestamp())
                        elif isinstance(created_at, (int, float)):
                            # Si es un timestamp numérico
                            created_at = datetime.fromtimestamp(created_at / 1000) # Dividir por 1000 si es en milisegundos
                        else:
                            # Último recurso, imprimir el tipo para depuración
                            logger.warning(f"Tipo de created_at no reconocido: {type(created_at)}")
                            created_at = datetime.now() - timedelta(hours=1) # Al menos 1 hora atrás para mostrar progreso
                    except Exception as e:
                        logger.error(f"Error convirtiendo created_at: {e}")
                        created_at = datetime.now() - timedelta(hours=1)
                
                target_users = data.get('targetUsers', [])
                filtered_users = data.get('filteredUsers', 0)
                target_count = data.get('targetCount', 0)

                # Si hay usuarios en targetUsers, usar esa longitud
                if target_users and isinstance(target_users, list) and len(target_users) > 0:
                    target_count = len(target_users) + filtered_users

                # Asegurar que sea al menos 1
                target_count = max(1, target_count)
                
                return Campaign(
                    id=doc.id,
                    name=data.get('name', ''),
                    campaign_type=data.get('campaignType', ''),
                    target_count=target_count,
                    processing_rate_per_hour=data.get('processingRatePerHour', 3),
                    created_at=created_at,
                    status=data.get('status', ''),
                    progress=data.get('progress', 0),
                    total_processed=data.get('totalProcessed', 0)
                )
            except Exception as e:
                print(f"Error obteniendo campaña: {e}")
                return None