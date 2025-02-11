document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.querySelector('.search-btn');
  const searchInput = document.querySelector('#search-input');
  const genreButtons = document.querySelectorAll('.genre-btn');
  const resultsContainer = document.querySelector('#results-container');
  const backButton = document.querySelector('.back-btn');
  const selectedGenresText = document.querySelector('#selected-list');
  const redirectButton = document.querySelector('#redirect-btn');  // Botão de redirecionamento

  let selectedGenres = [];

  // Função para exibir resultados
  function displayResults(animes) {
    resultsContainer.innerHTML = '';
    if (animes.length === 0) {
      resultsContainer.innerHTML = '<p>Nenhum anime encontrado.</p>';
      return;
    }

    animes.forEach(anime => {
      const animeCard = document.createElement('div');
      animeCard.classList.add('anime-card');

      // Definir a sinopse
      const synopsis = anime.synopsis || 'Sem sinopse disponível.';  // Sinopse em inglês ou padrão
      const translatedSynopsis = anime.synopsis_pt || synopsis;  // Tentativa de pegar a sinopse em português, se disponível

      animeCard.innerHTML = `
        <img src="${anime.images?.jpg?.image_url || 'default-image.jpg'}" alt="${anime.title}">
        <h3>${anime.title}</h3>
        <p>${translatedSynopsis}</p> <!-- Exibe a sinopse em português ou inglês -->
        <a href="${anime.url}" target="_blank">Saiba mais</a>
      `;
      resultsContainer.appendChild(animeCard);
    });
  }

  // Função para buscar animes usando as APIs: Jikan, AniList e Kitsu
  function searchAnime() {
    const query = searchInput.value.trim();
    const genreQuery = selectedGenres.join(',');

    if (query || genreQuery) {
      resultsContainer.innerHTML = '<p>Carregando...</p>'; // Mostra mensagem de carregamento

      // Primeira tentativa: Jikan API
      const jikanUrl = `https://api.jikan.moe/v4/anime?q=${query}&limit=20&genres=${genreQuery}`;
      fetch(jikanUrl)
        .then(response => response.json())
        .then(data => {
          if (data.data && data.data.length > 0) {
            const animes = data.data;
            displayResults(animes);
          } else {
            // Se Jikan não retornar resultados, tenta a AniList API
            fetchAniList(query, genreQuery);
          }
        })
        .catch(error => {
          console.error('Erro ao buscar animes na Jikan API:', error);
          // Se Jikan falhar, tenta a AniList API
          fetchAniList(query, genreQuery);
        });
    } else {
      alert('Por favor, insira um nome ou selecione um gênero.');
    }
  }

  // Função para buscar animes usando a AniList API (GraphQL)
  function fetchAniList(query, genreQuery) {
    const aniListUrl = 'https://graphql.anilist.co';
    const queryAniList = {
      query: `
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              medium
            }
          }
        }
      `,
      variables: { search: query }
    };

    fetch(aniListUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryAniList)
    })
      .then(response => response.json())
      .then(data => {
        const animes = data.data.Media ? [data.data.Media] : [];
        if (animes.length > 0) {
          displayResults(animes);
        } else {
          // Se AniList não retornar resultados, tenta a Kitsu API
          fetchKitsu(query, genreQuery);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar animes na AniList API:', error);
        // Se AniList falhar, tenta a Kitsu API
        fetchKitsu(query, genreQuery);
      });
  }

  // Função para buscar animes usando a Kitsu API
  function fetchKitsu(query, genreQuery) {
    const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${query}`;

    fetch(kitsuUrl)
      .then(response => response.json())
      .then(data => {
        const animes = data.data || [];
        if (animes.length > 0) {
          displayResults(animes);
        } else {
          resultsContainer.innerHTML = '<p>Nenhum anime encontrado.</p>';
        }
      })
      .catch(error => {
        console.error('Erro ao buscar animes na Kitsu API:', error);
        resultsContainer.innerHTML = '<p>Erro ao buscar animes. Tente novamente.</p>';
      });
  }

  // Função para selecionar gêneros
  function toggleGenreSelection(event) {
    const genreButton = event.target;
    const genreId = genreButton.getAttribute('data-genre');

    if (selectedGenres.includes(genreId)) {
      selectedGenres = selectedGenres.filter(id => id !== genreId);
      genreButton.classList.remove('selected');
    } else {
      selectedGenres.push(genreId);
      genreButton.classList.add('selected');
    }
    updateSelectedGenres();
  }

  // Atualiza a exibição dos gêneros selecionados
  function updateSelectedGenres() {
    selectedGenresText.textContent = selectedGenres.length > 0
      ? selectedGenres.join(', ')
      : 'Nenhum gênero selecionado';
  }

  // Limpa seleções
  function clearAll() {
    selectedGenres = [];
    searchInput.value = '';
    resultsContainer.innerHTML = '';
    selectedGenresText.textContent = 'Nenhum gênero selecionado';
    genreButtons.forEach(button => button.classList.remove('selected'));
  }

  // Função de redirecionamento para AnimesOnlineCC
  redirectButton.addEventListener('click', () => {
    window.location.href = 'https://animesonlinecc.to/';  // URL do AnimesOnlineCC
  });

  // Adicionando evento de pressionamento de tecla no campo de pesquisa (Enter)
  searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      searchAnime();
    }
  });

  // Eventos
  genreButtons.forEach(button => button.addEventListener('click', toggleGenreSelection));
  searchButton.addEventListener('click', searchAnime);
  backButton.addEventListener('click', clearAll);
});
