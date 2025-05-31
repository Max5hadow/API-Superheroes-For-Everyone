const API_TOKEN = 'dbdb046e0fb00a2d2abeac3ad8361bef'; //Token necesario para usar la API
const MAX_HEROES = 731; //Maximo de heroes
const PROXY_BASE = 'https://api.allorigins.win/get?url='; //Link del proxy
let currentRequestId = 0; //Busqueda actual

//Función para ver el actual publisher en la página
function getCurrentPublisher() {
  return document.getElementById('publisher-filter').value;
}

//Función para usar un proxy para poder usar la API
async function fetchWithProxy(url) {
  const proxyUrl = `${PROXY_BASE}${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error('Error fetching through proxy');
  const data = await response.json();
  return JSON.parse(data.contents);
}

//Función para cargar heroes de manera aleatoria
async function loadRandomHeroes() {
  const thisRequestId = ++currentRequestId; // Incrementa y captura el ID actual
  const resultsContainer = document.getElementById('results'); //Almacena donde debe ir la información
  resultsContainer.innerHTML = `<p class="text-center text-white">Loading random superheroes...</p>`; //Muestra el texto al cargar

  const heroes = []; //Crea una lista de los heroes
  const triedIds = new Set(); //Crea una lista de id

  while (heroes.length < 8 && triedIds.size < 100) {
    const id = Math.floor(Math.random() * MAX_HEROES) + 1;
    if (triedIds.has(id)) continue;
    triedIds.add(id);

    try { //Verifica que cumpla con el filtro del publisher para añadirlo a la lista de heroes
      const hero = await fetchWithProxy(`https://superheroapi.com/api/${API_TOKEN}/${id}`);
      const isMarvelOrDC = hero.biography.publisher === "Marvel Comics" || hero.biography.publisher === "DC Comics";
      const matchesFilter = getCurrentPublisher() === 'all' || hero.biography.publisher === getCurrentPublisher();

      if (hero.response === "success" && isMarvelOrDC && matchesFilter) {
        heroes.push(hero);
      }
    } catch (_) {
      // Ignorar errores
    }
  }
  if (thisRequestId !== currentRequestId) return; // Ignorar resultados viejos
  if (heroes.length === 0) { //Si no encuentra nada muestra este mensaje
    resultsContainer.innerHTML = `<p class="text-center text-white">Could not load random superheroes, please try reloading.</p>`;
    return;
  }
  //Limpia la página y crea las cartas respectivas para mostrar el heroe
  resultsContainer.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'row';
  heroes.forEach(hero => row.appendChild(createHeroCard(hero)));
  resultsContainer.appendChild(row);
}

//Busca y muestra un heroe
async function searchSuperhero() {
  const thisRequestId = ++currentRequestId;
  const query = document.getElementById('search').value.trim();

  if (!query) {
    loadRandomHeroes();
    return;
  }

  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = `<p class="text-center text-white">Loading results...</p>`;

  try {
    const apiUrl = `https://superheroapi.com/api/${API_TOKEN}/search/${encodeURIComponent(query)}`;
    const data = await fetchWithProxy(apiUrl);

    if (thisRequestId !== currentRequestId) return;
    if (data.response === "success") {
      let filteredHeroes = data.results.filter(hero => {
        const isMarvelOrDC = hero.biography.publisher === "Marvel Comics" || hero.biography.publisher === "DC Comics";
        const matchesFilter = getCurrentPublisher() === 'all' || hero.biography.publisher === getCurrentPublisher();
        return isMarvelOrDC && matchesFilter;
      });

      if (filteredHeroes.length === 0) {
        resultsContainer.innerHTML = `<p class="text-warning text-center">No superheroes found from the selected publisher with that name.</p>`;
        return;
      }

      resultsContainer.innerHTML = '';
      const row = document.createElement('div');
      row.className = 'row';
      filteredHeroes.forEach(hero => row.appendChild(createHeroCard(hero)));
      resultsContainer.appendChild(row);
    } else {
      resultsContainer.innerHTML = `<p class="text-danger text-center">Superhero not found.</p>`;
    }
  } catch (error) {
    if (thisRequestId !== currentRequestId) return;
    resultsContainer.innerHTML = `<p class="text-danger text-center">Error connecting to the proxy server.</p>`;
    console.error(error);
  }

  document.getElementById('search').value = ''; //Limpia la busqueda
}

//Función para crear las cartas que muestran la información del heroe
function createHeroCard(hero) {
  const col = document.createElement('div');
  col.className = 'col-md-3 mb-4';
  col.innerHTML = `
    <div class="card h-100 border-dark border-5 bg-black carta-marvel">
      <img src="${hero.image.url}" class="card-img-top" alt="${hero.name}"
           onerror="this.onerror=null; this.src='Assets/ImageNotFound/Personaje-secreto.jpg';">
      <div class="card-body bg-secondary text-white">
        <h5 class="card-title">${hero.name}</h5>
        <div class="card-text">
          <p><strong>Full name:</strong> ${hero.biography['full-name'] || 'Not available'}</p>
          <p><strong>Alter egos:</strong> ${hero.biography['alter-egos'].split(',').join('<br>') || 'Not available'}</p>
          <p><strong>Aliases:</strong> ${hero.biography.aliases.join(', ') || 'Not available'}</p>
          <p><strong>Place of birth:</strong> ${hero.biography['place-of-birth'] || 'Not available'}</p>
          <p><strong>First appearance:</strong> ${hero.biography['first-appearance'] || 'Not available'}</p>
          <p><strong>Publisher:</strong> ${hero.biography.publisher || 'Not available'}</p>
          <p><strong>Alignment:</strong> ${hero.biography.alignment || 'Not available'}</p>
          <p><strong>Affiliation:</strong> ${hero.connections['group-affiliation'].split(',').join('<br>') || 'Not available'}</p>
        </div>
      </div>
    </div>
  `;

  return col;
}

//Actualiza el fondo según el filtro
function updateBackground(publisher) {
  const body = document.body;
  body.classList.remove('default-bg', 'marvel-bg', 'dc-bg');

  switch (publisher) {
    case 'Marvel Comics':
      body.classList.add('marvel-bg');
      break;
    case 'DC Comics':
      body.classList.add('dc-bg');
      break;
    default:
      body.classList.add('default-bg');
  }
}

//Usar enter para buscar
document.getElementById('search').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchSuperhero();
  }
});

//Funciona al cargar contenido del DOM
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('publisher-filter');

  select.addEventListener('change', (e) => {
    e.preventDefault();
    const selected = getCurrentPublisher();
    updateBackground(selected);
  });

  updateBackground(getCurrentPublisher());
  loadRandomHeroes();
});
