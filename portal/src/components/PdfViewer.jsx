import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

export default function PdfViewer({ resource, onClose }) {
  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[85vh] bg-[#141a14] border border-[#232f23] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0e130e] border-b border-[#232f23] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8EB486]/10 flex items-center justify-center text-[#8EB486]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#E2E8F0]">{resource.titulo}</h3>
              <p className="text-xs text-[#8F9B8D]">Cuadernillo Terapéutico Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={resource.signedUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 bg-[#1a231a] hover:bg-[#232f23] border border-[#8EB486]/20 rounded-lg text-xs font-medium text-[#E2E8F0] transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#8EB486]" />
              <span>Descargar</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8F9B8D] hover:text-[#E2E8F0] hover:bg-[#232f23] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visor PDF Nativo */}
        <div className="flex-1 bg-[#1a231a]/50 p-2">
          <object
            data={resource.signedUrl}
            type="application/pdf"
            className="w-full h-full rounded-xl"
          >
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#8F9B8D]">
              <p className="mb-4 text-sm">Tu navegador no soporta la previsualización directa de este archivo PDF.</p>
              <a
                href={resource.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 bg-[#8EB486] text-[#0A0D0A] font-semibold text-xs rounded-xl flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir PDF en una nueva pestaña
              </a>
            </div>
          </object>
        </div>
      </div>
    </div>
  );
}
