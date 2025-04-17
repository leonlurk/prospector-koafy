from datetime import datetime, timedelta
import math
from models import Campaign, ProgressData, ChartPoint, ChartData
import logging

logger = logging.getLogger(__name__)

class CampaignService:
   @staticmethod
   def calculate_progress(campaign: Campaign) -> ProgressData:
       """Calcula el progreso actual de una campaña basado en lotes"""
       logger.info(f"Calculando progreso para campaña: {campaign.id}")
       
       if not campaign.created_at:
           logger.warning(f"Campaña {campaign.id} no tiene created_at, devolviendo progreso cero")
           return ProgressData(percentage=0, completed_batches=0, messages_sent=0, next_batch_in="--:--")
       
       # Datos básicos
       rate = campaign.processing_rate_per_hour
       total_users = max(1, campaign.target_count)  # Evitar división por cero
       
       logger.info(f"Tasa de procesamiento: {rate}, Total usuarios: {total_users}")
       
       # Calcular tiempo transcurrido - LIMITAR PARA CAMPAÑAS ANTIGUAS
       now = datetime.now()
       created_at = campaign.created_at
       
       # Si la campaña es muy antigua (más de 24h), limitar tiempo para simulación
       if (now - created_at).total_seconds() > 86400:  # 24 horas en segundos
           created_at = now - timedelta(hours=23, minutes=45)  # Simular casi 24h
           logger.info(f"Campaña antigua detectada, usando fecha simulada: {created_at}")
           
       elapsed_seconds = (now - created_at).total_seconds()
       elapsed_hours = elapsed_seconds / 3600
       
       logger.info(f"Fecha actual: {now}, Fecha creación: {created_at}")
       logger.info(f"Tiempo transcurrido: {elapsed_seconds} segundos, {elapsed_hours} horas")
       
       # Primer lote al inicio + lotes por hora completada
       completed_batches = 1 + math.floor(elapsed_hours)
       messages_sent = min(completed_batches * rate, total_users)
       
       # Porcentaje basado en mensajes enviados
       percentage = math.floor((messages_sent / total_users) * 100)
       
       logger.info(f"Lotes completados: {completed_batches}, Mensajes enviados: {messages_sent}, Porcentaje: {percentage}%")
       
       # Tiempo hasta el próximo lote
       seconds_in_current_hour = (elapsed_hours - math.floor(elapsed_hours)) * 3600
       seconds_to_next_batch = 3600 - seconds_in_current_hour
       next_batch_in = f"{int(seconds_to_next_batch // 60)}m {int(seconds_to_next_batch % 60)}s"
       
       # Progreso dentro del batch actual (0-100%)
       batch_progress = math.floor((seconds_in_current_hour / 3600) * 100)
       
       logger.info(f"Segundos en hora actual: {seconds_in_current_hour}, Segundos para próximo lote: {seconds_to_next_batch}")
       logger.info(f"Próximo lote en: {next_batch_in}, Progreso de batch: {batch_progress}%")
       
       # Tiempo estimado de finalización
       try:
           total_hours_needed = math.ceil(total_users / rate)
           if math.isfinite(total_hours_needed) and total_hours_needed > 0:
               estimated_completion = created_at + timedelta(hours=total_hours_needed)
           else:
               logger.warning(f"Valor no válido para horas: {total_hours_needed}")
               estimated_completion = None
       except Exception as e:
           logger.error(f"Error al calcular fecha de finalización: {e}")
           estimated_completion = None
       
       logger.info(f"Horas totales necesarias: {total_hours_needed}, Finalización estimada: {estimated_completion}")
       
       # Formato tiempo transcurrido
       hours = int(elapsed_hours)
       minutes = int((elapsed_hours * 60) % 60)
       seconds = int(elapsed_seconds % 60)
       time_elapsed = f"{hours}:{minutes:02d}:{seconds:02d}"
       
       logger.info(f"Tiempo transcurrido formateado: {time_elapsed}")
       
       progress_data = ProgressData(
           percentage=percentage,
           completed_batches=completed_batches,
           messages_sent=messages_sent,
           next_batch_in=next_batch_in,
           estimated_completion_time=estimated_completion,
           time_elapsed=time_elapsed,
           batch_progress=batch_progress
       )
       
       logger.info(f"ProgressData generado: {progress_data}")
       return progress_data
   
   @staticmethod
   def generate_chart_data(campaign: Campaign) -> ChartData:
       """Genera datos para el gráfico de escalones"""
       logger.info(f"Generando datos de gráfico para campaña: {campaign.id}")
       
       total_users = max(1, campaign.target_count)
       rate = campaign.processing_rate_per_hour
       total_hours = math.ceil(total_users / rate)
       
       logger.info(f"Total usuarios: {total_users}, Tasa: {rate}, Total horas: {total_hours}")
       
       # Limitar total de horas para el gráfico
       max_hours_to_display = min(total_hours, 24)
       
       # Calcular tiempo real transcurrido (limitado a 24h para campañas antiguas)
       now = datetime.now()
       created_at = campaign.created_at
       
       if not created_at:
           logger.warning("La campaña no tiene created_at, usando 0 horas transcurridas")
           elapsed_hours = 0
       else:
           # Si la campaña es muy antigua, limitar para simulación
           if (now - created_at).total_seconds() > 86400:  # 24 horas
               created_at = now - timedelta(hours=23)
               logger.info(f"Campaña antigua detectada, usando fecha simulada para el gráfico: {created_at}")
               
           elapsed_hours = (now - created_at).total_seconds() / 3600
           logger.info(f"Tiempo transcurrido: {elapsed_hours} horas")
       
       points = []
       
       # Escalones de progreso, uno por hora
       for i in range(max_hours_to_display + 1):
           # Para hora 0, mostrar el primer lote. Para horas siguientes, acumular
           messages_at_hour = min((i+1) * rate, total_users) if i > 0 else min(rate, total_users)
           
           point = ChartPoint(
               hour=i,
               messages=messages_at_hour
           )
           points.append(point)
           logger.info(f"Punto {i}: hora={i}, mensajes={messages_at_hour}")
       
       # Marcar punto actual basado en el tiempo transcurrido
       current_hour_index = min(math.floor(elapsed_hours), max_hours_to_display)
       if 0 <= current_hour_index < len(points):
           points[current_hour_index].is_current = True
           logger.info(f"Punto actual marcado: índice {current_hour_index}, hora {points[current_hour_index].hour}")
       
       chart_data = ChartData(
           points=points,
           total_hours=total_hours,
           total_messages=total_users
       )
       
       logger.info(f"ChartData generado con {len(points)} puntos")
       return chart_data