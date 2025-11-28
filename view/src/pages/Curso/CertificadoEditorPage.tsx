import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCertificadoModeloPorId,
  criarCertificadoModelo,
  editarCertificadoModelo,
} from "../../services/apiCertificadoModelo";
import { Button, Input } from "../../components/Formularios/Inputs";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ArrowLeft, Pencil } from "lucide-react";

export interface PaginaCertificado {
  titulo: string;
  html: string;
}

export default function CertificadoEditorPage() {
  const navigate = useNavigate();
  type QuillEditor = ReactQuill & { getEditor: () => any };
  const quillRefs = useRef<(QuillEditor | null)[]>([]);

  const { idCertificadoModelo } = useParams();
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [paginas, setPaginas] = useState<PaginaCertificado[]>([
    { titulo: "Página 1 - Certificado", html: "" },
    { titulo: "Página 2 - Conteúdo Programático", html: "" },
  ]);
  const [abaAtiva, setAbaAtiva] = useState("pagina-0");

  useEffect(() => {
    console.log(idCertificadoModelo);
    if (idCertificadoModelo && idCertificadoModelo !== "novo") {
      setLoading(true);
      getCertificadoModeloPorId(Number(idCertificadoModelo))
        .then((data) => {
          setTitulo(data.titulo);
          setPaginas(data.conteudoHtml || []);
        })
        .catch(() => toast.error("Erro ao carregar modelo."))
        .finally(() => setLoading(false));
    }
  }, [idCertificadoModelo]);

  const handleSalvar = async () => {
    setLoading(true);
    try {
      const payload = {
        titulo,
        conteudoHtml: paginas,
      };

      if (idCertificadoModelo && idCertificadoModelo !== "novo") {
        await editarCertificadoModelo(Number(idCertificadoModelo), payload);
      } else {
        await criarCertificadoModelo(payload);
      }

      toast.success("Modelo salvo com sucesso.");
    } catch (e) {
      toast.error("Erro ao salvar modelo.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaginaChange = (index: number, newHtml: string) => {
    const novas = [...paginas];
    novas[index].html = newHtml;
    setPaginas(novas);
  };

  const handleTituloPaginaChange = (index: number, newTitulo: string) => {
    const novas = [...paginas];
    novas[index].titulo = newTitulo;
    setPaginas(novas);
  };

  const inserirVariavel = (texto: string) => {
    const indexAtivo = Number(abaAtiva.replace("pagina-", ""));
    const instance = quillRefs.current[indexAtivo];
    if (!instance) return;

    const editor = instance.getEditor();
    const range = editor.getSelection(true);

    // Insere o texto
    editor.insertText(range.index, texto, "user");

    // Posiciona o cursor depois da palavra inserida
    editor.setSelection(range.index + texto.length, 0);
  };


  return (
    <div className="flex flex-col rounded h-[95vh]">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-3 bg-white rounded border border-gray-300">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full transition cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {!editandoTitulo ? (
                <>
                  <h1 className="text-xl font-semibold">
                    {titulo || "Sem título"}
                  </h1>

                  <button
                    onClick={() => setEditandoTitulo(true)}
                    className="text-xs p-2 text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    name="tituloModelo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título do modelo"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSalvar} disabled={loading}>Salvar</Button>
        </div>
      </div>

      {/* BODY GRID - FORÇA A ALTURA ATÉ O FIM DA TELA */}
      <div className="flex flex-1 overflow-hidden py-2">

        {/* LEFT SIDEBAR */}
        <div className="w-40 bg-white p-4 flex flex-col border rounded border-gray-300 h-full overflow-y-auto">
          <h2 className="text-sm font-semibold mb-3">PÁGINAS</h2>

          <div className="flex flex-col gap-3">
            {paginas.map((_p, i) => (
              <div
                key={i}
                className={`border rounded-md p-2 cursor-pointer ${abaAtiva === `pagina-${i}`
                  ? "border-blue-600 shadow"
                  : "border-gray-300"
                  }`}
                onClick={() => setAbaAtiva(`pagina-${i}`)}
              >
                <div className="text-xs font-semibold mb-1">{i + 1}</div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER EDITOR AREA */}
        <div className="flex-1 flex flex-col overflow-auto pl-3">

          <div className="w-full bg-white p-6 rounded border border-gray-300 min-h-full">

            {paginas.map((pagina, index) => (
              <div
                key={index}
                hidden={abaAtiva !== `pagina-${index}`}
                className="flex flex-col gap-4 min-h-full"
              >
                <Input
                  name="titulo"
                  label="Título da Página"
                  value={pagina.titulo}
                  onChange={(e) => handleTituloPaginaChange(index, e.target.value)}
                />

                <div className="h-full">
                  <ReactQuill
                    ref={(el) => {
                      quillRefs.current[index] = el;
                    }}
                    theme="snow"
                    value={pagina.html}
                    onChange={(value) => handlePaginaChange(index, value)}
                    style={{ height: "300px" }}
                  />
                </div>
              </div>
            ))}

          </div>
        </div>

        <div className="w-56 bg-white border border-gray-300 rounded p-4 flex flex-col gap-4 ml-4">

          <h2 className="text-sm font-semibold text-gray-700">Variáveis disponíveis</h2>

          <p className="text-xs text-gray-500">
            Clique para inserir a variável no conteúdo do certificado.
          </p>

          <div className="flex flex-col gap-2 mt-2">

            {[
              "{{nomeAluno}}",
              "{{curso}}",
              "{{dataConclusao}}",
              "{{cargaHoraria}}",
              "{{instrutor}}",
              "{{empresa}}",
            ].map((varName) => (
              <button
                key={varName}
                className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-mono"
                onClick={() => inserirVariavel(varName)}
              >
                {varName}
              </button>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}
