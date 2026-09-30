// ==== CONFIG DA LOJA — tudo que muda na loja fica aqui ====
// Produtos e preços NÃO ficam aqui: saem de assets/produtos.js, gerado por tools/build.py.
window.LOJA_CONFIG = {
  whatsapp: '5549999037322',     // TROCAR pelo número do clube (hoje é o provisório do Willian, igual ao site)
  siteClube: 'https://euwill-maker.github.io/clube-tiro-slo/',  // TROCAR para https://clubedetiroslo.com.br quando o site for pro domínio
  instagram: 'https://www.instagram.com/clubedetiroslo/',
  preview: true,                 // true = faixa "prévia" no topo (desligar na versão final)
  porPagina: 24,                 // quantos produtos aparecem antes do "Ver mais"
  metaPixel: '',                 // ID do Pixel da Meta (só números) — vazio = desligado
  ga4: '',                       // ID do GA4 (G-XXXXXXX) — vazio = desligado
};
