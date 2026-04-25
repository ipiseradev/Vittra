import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Loader2,
  Search,
  SendHorizonal,
  Sparkles,
  UserRound,
} from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import type {
  AssistantProvider,
  Patient,
  PatientAssistantChatResponse,
} from "../../types/domain";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  meta?: string;
};

type PatientAssistantPanelProps = {
  mode?: "inline" | "modal";
};

const quickPrompts = [
  "Dame un resumen clínico breve.",
  "¿Qué debería revisar antes de la próxima cita?",
  "Resume alergias, diagnósticos y plan reciente.",
];

function buildWelcomeMessage(patient: Patient | null): ChatMessage {
  return {
    id: `welcome-${patient?.id ?? "none"}`,
    role: "assistant",
    content: patient
      ? `Ya tengo el contexto de **${patient.full_name}**. Podés pedir un resumen clínico o elegir una sugerencia rápida.`
      : "Seleccioná un paciente para empezar el análisis.",
    meta: "Asistente clínico IA",
  };
}

function getProviderLabel(
  response: Pick<
    PatientAssistantChatResponse,
    "provider_used" | "fallback_used" | "model"
  >
) {
  if (response.fallback_used || response.provider_used === "demo") {
    return `Modo demo · ${response.model}`;
  }
  return `${response.provider_used.toUpperCase()} · ${response.model}`;
}

function TypingIndicator() {
  return (
    <div className="border-b border-white/5 bg-[#444654]">
      <div className="mx-auto flex max-w-4xl gap-4 px-6 py-8">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#10a37f] text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm italic text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Vittra IA está revisando el historial del paciente...
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-white/5 ${isUser ? "bg-[#343541]" : "bg-[#444654]"}`}
    >
      <div className="mx-auto flex max-w-4xl gap-4 px-6 py-8">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-white ${
            isUser ? "bg-slate-600" : "bg-[#10a37f]"
          }`}
        >
          {isUser ? (
            <UserRound className="h-5 w-5" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-tight text-slate-400">
            {isUser ? "Vos" : message.meta ?? "Asistente IA"}
          </p>
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-100">
            {message.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PatientAssistantPanel({
  mode = "inline",
}: PatientAssistantPanelProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [provider] = useState<AssistantProvider>("auto");
  const [patientSearch, setPatientSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<PatientAssistantChatResponse | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isModal = mode === "modal";

  useEffect(() => {
    async function init() {
      try {
        const data = await trainityApi.getPatients({ isActive: true });
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      } catch {
        setError("No se pudieron cargar los pacientes para el asistente.");
      }
    }

    init();
  }, []);

  useEffect(() => {
    const selected = patients.find((patient) => patient.id === selectedPatientId) ?? null;
    setMessages([buildWelcomeMessage(selected)]);
    setLastResponse(null);
  }, [selectedPatientId, patients]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) =>
        patient.full_name.toLowerCase().includes(patientSearch.toLowerCase())
      ),
    [patients, patientSearch]
  );

  async function submitQuestion(text: string) {
    if (!text.trim() || !selectedPatientId || sending) return;

    setSending(true);
    setMessage("");
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}`, role: "user", content: text },
    ]);

    try {
      const response = await trainityApi.chatWithPatientAssistant(selectedPatientId, {
        message: text,
        provider,
      });
      setLastResponse(response);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          meta: getProviderLabel(response),
        },
      ]);
    } catch {
      setError("Falló la comunicación con el asistente clínico.");
    } finally {
      setSending(false);
    }
  }

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);

  return (
    <section
      className={`flex overflow-hidden bg-[#202123] text-white shadow-2xl ${
        isModal ? "h-full" : "min-h-[680px] rounded-[28px]"
      }`}
    >
      <aside className="flex w-[270px] flex-col border-r border-white/10 bg-[#202123] p-3">
        <button
          type="button"
          className="mb-4 flex w-full items-center gap-3 rounded-md border border-white/20 p-3 text-sm transition hover:bg-[#2b2c2f]"
        >
          <Sparkles className="h-4 w-4" />
          Nueva consulta IA
        </button>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
            className="w-full rounded-md border border-white/10 bg-transparent py-2 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-[#10a37f]"
            placeholder="Buscar paciente..."
          />
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {filteredPatients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => setSelectedPatientId(patient.id)}
              className={`flex w-full items-center gap-3 rounded-md p-3 text-left text-sm transition ${
                patient.id === selectedPatientId
                  ? "bg-[#343541]"
                  : "hover:bg-[#2b2c2f]"
              }`}
            >
              <UserRound className="h-4 w-4 text-slate-400" />
              <span className="truncate">{patient.full_name}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 border-t border-white/10 px-2 pt-4 text-[10px] uppercase tracking-[0.22em] text-slate-500">
          Vittra AI demo
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-[#343541]">
        <div className="border-b border-white/5 px-5 py-3 text-center text-xs font-medium text-slate-400">
          Modelo: {provider.toUpperCase()} · Paciente: {selectedPatient?.full_name ?? "Sin seleccionar"}
          {lastResponse ? ` · ${getProviderLabel(lastResponse)}` : ""}
        </div>

        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="border-b border-white/5 bg-[#5b2228] px-6 py-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          {messages.map((chatMessage) => (
            <ChatMessageItem key={chatMessage.id} message={chatMessage} />
          ))}
          {sending ? <TypingIndicator /> : null}
          <div ref={messagesEndRef} />
        </div>

        <footer className="bg-gradient-to-t from-[#343541] via-[#343541] to-transparent p-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitQuestion(prompt)}
                  className="rounded-md border border-white/10 bg-[#343541] px-3 py-2 text-xs text-slate-300 transition hover:bg-[#40414f]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitQuestion(message);
              }}
              className="relative"
            >
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitQuestion(message);
                  }
                }}
                className="w-full resize-none rounded-xl border-none bg-[#40414f] py-4 pl-4 pr-12 text-[15px] text-white shadow-lg placeholder:text-slate-500 focus:ring-0"
                placeholder="Escribí una consulta clínica..."
                rows={1}
              />
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="absolute bottom-3 right-3 rounded-md bg-[#10a37f] p-1.5 text-white transition-colors disabled:bg-slate-700 disabled:text-slate-400"
              >
                <SendHorizonal className="h-5 w-5" />
              </button>
            </form>

            <p className="mt-3 text-center text-[11px] text-slate-500">
              Vittra IA puede cometer errores. Verificá siempre la información
              clínica importante.
            </p>
          </div>
        </footer>
      </main>
    </section>
  );
}
