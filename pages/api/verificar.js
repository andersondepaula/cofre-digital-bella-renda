import {
  getDoc,
  ABA_SENHAS,
  ABA_SORTEIOS,
  ABA_CASHBACK,
  normalizarSenha,
  agora,
} from "../../lib/sheets";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { senha } = req.body || {};

  if (!senha) {
    return res.status(400).json({ erro: "Informe a senha" });
  }

  const senhaNormalizada = normalizarSenha(senha);

  try {
    const doc = await getDoc();
    const sheetSenhas = doc.sheetsByTitle[ABA_SENHAS];
    const sheetSorteios = doc.sheetsByTitle[ABA_SORTEIOS];
    const sheetCashback = doc.sheetsByTitle[ABA_CASHBACK];

    const linhasSenhas = await sheetSenhas.getRows();
    const linha = linhasSenhas.find(
      (l) => normalizarSenha(l.get("Senha")) === senhaNormalizada
    );

    if (!linha) {
      return res.status(404).json({ erro: "Senha inválida." });
    }

    const foiSorteada = (linha.get("Sorteada (SIM/NAO)") || "NAO").toUpperCase() === "SIM";
    if (!foiSorteada) {
      return res.status(400).json({ erro: "Essa senha ainda não foi liberada para nenhuma cliente." });
    }

    const jaRevelada = (linha.get("Revelada (SIM/NAO)") || "NAO").toUpperCase() === "SIM";
    const status = linha.get("Status");
    const premio = linha.get("Prêmio") || "";
    const nomeCliente = linha.get("Nome Cliente") || "";
    const whatsappCliente = linha.get("WhatsApp Cliente") || "";

    if (jaRevelada) {
      return res.status(200).json({
        resultado: status === "Ganhadora" ? "GANHOU" : "PERDEU",
        premio: status === "Ganhadora" ? premio : null,
        jaAberta: true,
      });
    }

    const dataHora = agora();
    linha.set("Revelada (SIM/NAO)", "SIM");
    linha.set("Data Revelação", dataHora);
    await linha.save();

    const linhasSorteios = await sheetSorteios.getRows();
    const linhaSorteio = linhasSorteios.find(
      (l) => normalizarSenha(l.get("Senha Sorteada")) === senhaNormalizada
    );
    if (linhaSorteio) {
      linhaSorteio.set("Resultado", status === "Ganhadora" ? "Ganhou" : "Perdeu");
      linhaSorteio.set("Prêmio", status === "Ganhadora" ? premio : "");
      await linhaSorteio.save();
    }

    if (status !== "Ganhadora") {
      await sheetCashback.addRow({
        "Nome Cliente": nomeCliente,
        WhatsApp: whatsappCliente,
        "Senha (perdedora)": senhaNormalizada,
        "Data da Perda": dataHora,
        "Data Envio Cashback": "",
        "Prazo Validade (30 dias)": "",
        Status: "Pendente",
      });
    }

    return res.status(200).json({
      resultado: status === "Ganhadora" ? "GANHOU" : "PERDEU",
      premio: status === "Ganhadora" ? premio : null,
      jaAberta: false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro interno ao verificar senha.", detalhe: err.message });
  }
}
