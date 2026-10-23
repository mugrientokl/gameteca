export function filterCatalogGames(games, filters) {
  const title = filters.titulo?.trim().toLocaleLowerCase() || "";

  return games.filter((game) =>
    (!title || game.titulo.toLocaleLowerCase().includes(title)) &&
    (!filters.genero || game.generos?.includes(filters.genero)) &&
    (!filters.plataforma || game.plataformas?.includes(filters.plataforma))
  );
}
