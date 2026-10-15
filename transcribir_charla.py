import whisper
import json
import sys
import os

audio_path = "audio_charla_octubre.mp3"
print(f"Cargando modelo Whisper en GPU...")
model = whisper.load_model("small", device="cuda")

print(f"Iniciando transcripcion con timestamps de {audio_path}...")
result = model.transcribe(
    audio_path,
    language="es",
    verbose=False,
    initial_prompt="Conversacion entre Mauro y Alan sobre el rediseño y funciones del sitio web de Psicologia Vegana Argentina, psicologia verde, tienda, productos, cursos, agenda y pacientes."
)

output_json = "transcripcion_segmentos.json"
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Transcripcion completa y guardada en transcripcion_segmentos.json")
