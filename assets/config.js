// ==== CONFIG DA LOJA — tudo que muda na loja fica aqui ====
// Produtos e preços NÃO ficam aqui: saem de assets/produtos.js, gerado por tools/build.py.
window.LOJA_CONFIG = {
  whatsapp: '5549998313371',     // WhatsApp do Willian (escolhido por ele no lançamento, 10/10/2026)
  siteClube: 'https://euwill-maker.github.io/clube-tiro-slo/',  // TROCAR para https://clubedetiroslo.com.br quando o site for pro domínio
  instagram: 'https://www.instagram.com/clubedetiroslo/',
  preview: false,                // true = faixa "prévia" no topo (desligar na versão final)
  mostrarPrecos: false,          // false = sem valores na loja: o pedido vira orçamento no WhatsApp (pedido do Willian, 10/10/2026)
  porPagina: 24,                 // quantos produtos aparecem antes do "Ver mais"
  metaPixel: '',                 // ID do Pixel da Meta (só números) — vazio = desligado
  ga4: '',                       // ID do GA4 (G-XXXXXXX) — vazio = desligado
};
