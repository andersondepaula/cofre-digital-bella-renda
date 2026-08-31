import {
  getDoc,
  ABA_SENHAS,
  ABA_SORTEIOS,
  normalizarWhatsapp,
  agora,
} from "../../lib/sheets";

const URL_DO_COFRE = process.env.URL_DO_COFRE || "https://SEU-SITE.vercel.app";

function montarMensagem(senha, whatsappOriginal) {
  return (
    `Parabéns! 🎉 Você ganhou o direito de abrir o Cofre Digital da reinauguração da Bella Renda!\n\n` +
    `Acesse o link abaixo e digite sua senha para tentar abrir o cofre:\n` +
    `${URL_DO_COFRE}\n\n` +
    `Sua senha: ${senha}`
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { nome, whatsapp } = req.body || {};

  if (!nome || !whatsapp) {
    return res.status(400).json({ erro: "Informe nome e whatsapp da cliente" });
  }

  try {
    const doc = await getDoc();
    const sheetSenhas = doc.sheetsByTitle[ABA_SENHAS];
    const sheetSorteios = doc.sheetsByTitle[ABA_SORTEIOS];

    if (!sheetSenhas || !sheetSorteios) {
      return res.status(500).json({
        erro: "Abas 'Senhas' e/ou 'Sorteios' não encontradas na planilha. Confira os nomes exatos das abas.",
      });
    }

    const whatsappNormalizado = normalizarWhatsapp(whatsapp);

    const MAX_TENTATIVAS = 5;
    for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
      const linhas = await sheetSenhas.getRows();
      const disponiveis = linhas.filter(
        (l) => (l.get("Sorteada (SIM/NAO)") || "NAO").toUpperCase() === "NAO"
      );

      if (disponiveis.length === 0) {
        return res.status(409).json({ erro: "Não há mais senhas disponíveis no cofre." });
      }

      const escolhida = disponiveis[Math.floor(Math.random() * disponiveis.length)];

      await escolhida.reload?.().catch(() => {});
      if ((escolhida.get("Sorteada (SIM/NAO)") || "NAO").toUpperCase() === "SIM") {
        continue;
      }

      const senha = escolhida.get("Senha");
      const dataHora = agora();

      escolhida.set("Sorteada (SIM/NAO)", "SIM");
      escolhida.set("Data Sorteio", dataHora);
      escolhida.set("Nome Cliente", nome);
      escolhida.set("WhatsApp Cliente", whatsappNormalizado);
      await escolhida.save();

      const mensagem = montarMensagem(senha, whatsappNormalizado);
      const linkWhatsapp = `https://wa.me/${whatsappNormalizado}?text=${encodeURIComponent(
        mensagem
      )}`;

      await sheetSorteios.addRow({
        "Data/Hora": dataHora,
        "Nome Cliente": nome,
        WhatsApp: whatsappNormalizado,
        "Senha Sorteada": senha,
        Resultado: "Pendente",
        Prêmio: "",
        "Link WhatsApp Gerado": linkWhatsapp,
        "Cashback: Enviado p/ Campanha (SIM/NAO)": "NAO",
      });

      return res.status(200).json({
        senha,
        linkWhatsapp,
      });
    }

    return res
      .status(409)
      .json({ erro: "Muita concorrência no sorteio, tente novamente em instantes." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro interno ao sortear senha.", detalhe: err.message });
  }
}
