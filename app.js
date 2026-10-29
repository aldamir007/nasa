
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function renderizar(res, dados = {}) {
  res.render('index', {
    astro: '',
    imagens: [],
    erro: '',
    pesquisou: false,
    ...dados
  });
}

app.get('/', (req, res) => {
  renderizar(res);
});

app.post('/pesquisar', async (req, res) => {
  const astro = (req.body.astro || '').trim();

  if (!astro) {
    return renderizar(res, {
      erro: 'Digite o nome de um astro para começar.',
      pesquisou: true
    });
  }

  if (astro.length > 100) {
    return renderizar(res, {
      astro: astro.slice(0, 100),
      erro: 'O nome pesquisado é muito longo.',
      pesquisou: true
    });
  }

  try {
    const resposta = await axios.get(
      'https://images-api.nasa.gov/search',
      {
        params: {
          q: astro,
          media_type: 'image',
          page_size: 30
        },
        timeout: 20000
      }
    );

    const resultados = resposta.data.collection.items || [];

    const imagens = resultados
      .filter(item => {
        const dados = item.data?.[0];
        const linkImagem = item.links?.find(
          link => link.rel === 'preview' && link.href
        );

        return dados && linkImagem;
      })
      .map(item => {
        const dados = item.data[0];
        const linkImagem = item.links.find(
          link => link.rel === 'preview' && link.href
        );

        return {
          titulo: dados.title || 'Imagem astronômica',
          descricao: dados.description || 'A NASA não forneceu uma descrição para esta imagem.',
          data: dados.date_created
            ? dados.date_created.slice(0, 10)
            : '',
          imagem: linkImagem.href,
          id: dados.nasa_id || ''
        };
      });

    renderizar(res, {
      astro,
      imagens,
      pesquisou: true,
      erro: imagens.length
        ? ''
        : 'Não encontramos imagens para essa pesquisa. Tente outro nome.'
    });
  } catch (erro) {
    console.error(
      'Erro ao consultar a NASA:',
      erro.response?.status || erro.message
    );

    renderizar(res, {
      astro,
      pesquisou: true,
      erro: 'Não foi possível carregar as imagens. Confira sua conexão e tente novamente.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`NASA Explorer rodando em http://localhost:${PORT}`);
});
