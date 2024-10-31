    const theatersURL = "https://www.finnkino.fi/xml/TheatreAreas/";
    const scheduleURL = "https://www.finnkino.fi/xml/Schedule/?area=";
    const omdbAPIKey = "d745aa9";
    let moviesCache = {};

    // creating moviecards into div
    const createMovieCard = (movie) => {
        const movieCard = document.createElement("div");
        movieCard.className = "movie-card";

        const movieImg = document.createElement("img");
        if (movie.Poster && movie.Poster !== "N/A") {
        movieImg.src = movie.Poster;
        } else { // add picture if omdb doesn't have it
            movieImg.src = "https://th.bing.com/th/id/OIP.eg3YSZgxiTgZpfNjvKZQlQHaFj?rs=1&pid=ImgDetMain";
        }
        movieCard.appendChild(movieImg);

        const movieDetails = document.createElement("div");
        movieDetails.className = "movie-details";

        const title = document.createElement("h3");
        title.innerText = movie.Title;
        movieDetails.appendChild(title);

        const synopsis = document.createElement("p");
        synopsis.innerText = (movie.Plot && movie.Plot !== "N/A") ? movie.Plot : "No description available.";
        movieDetails.appendChild(synopsis);
        
        const ratings = document.createElement("p") // my own rating idea
        ratings.className = "ratio";
        let imdb = "";
        
        if (movie.Title ===  "Venom: The Last Dance"){
            imdb = "6.2";
        } if (movie.Title ===  "Perhoset"){
            imdb = "6.3";
        } if (movie.Title ===  "The Substance"){
            imdb = "7.6";
        } if (movie.Title ===  "We Live in Time"){
            imdb = "7.3";
        } if (movie.Title ===  "Smile 2"){
            imdb = "7.2 + Site owner's recommendation.";
        } if (movie.Title ===  "Joker: Folie à Deux"){
            imdb = "5.3 + Site owner's advice is to avoid this one.";
        } if (movie.Title ===  "Vares X"){
            imdb = "4.2";
        } if (movie.Title ===  "The Apprentice"){
            imdb = "7.3";
        } if (movie.Title ===  "Terrifier 3"){
            imdb = "6.7";
        }
        ratings.innerText = imdb ? `Rating: ${imdb}` : "Rating: Not Available";
        movieDetails.appendChild(ratings);

        const theaterSelect = document.getElementById("theaterSelect");
        const theaterName = theaterSelect.options[theaterSelect.selectedIndex].text; // Theater name

        movie.showtimes.forEach((time) => { // showtimes 
            const date = new Date(time);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const formattedTime = `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
            const showtime = document.createElement("p");
            showtime.className = "showtime";
            if (theaterName !== "Pääkaupunkiseutu") {
                showtime.innerText = `Showtimes today at ${theaterName} (${formattedDate}): ${formattedTime}`;
            } else {
                showtime.innerText = `Showtimes today (${formattedDate}): ${formattedTime}`;
            }
            movieDetails.appendChild(showtime);
        });

        movieCard.appendChild(movieDetails);
        return movieCard;
    };

    // load theaters from finnKino xml
    async function loadTheaters() {
        const response = await fetch(theatersURL);
        const data = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml");
        const theaters = xml.getElementsByTagName("TheatreArea");

        const theaterSelect = document.getElementById("theaterSelect");
        Array.from(theaters).forEach(theater => {
            const option = document.createElement("option");
            option.value = theater.getElementsByTagName("ID")[0].textContent;
            option.textContent = theater.getElementsByTagName("Name")[0].textContent;
            theaterSelect.appendChild(option);
        });
    }

    // load movies from theater
    async function loadMovies(theaterId) {
        const response = await fetch(`${scheduleURL}${theaterId}`);
        const data = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml");
        const shows = xml.getElementsByTagName("Show");

        moviesCache = {}; // reset cache
        for (let show of shows) {
            const title = show.getElementsByTagName("Title")[0].textContent;
            const showtime = show.getElementsByTagName("dttmShowStart")[0].textContent;

            if (!moviesCache[title]) {
                try {
                    const omdbResponse = await fetch(`https://www.omdbapi.com/?t=${title}&apikey=${omdbAPIKey}`);
                    const movieData = await omdbResponse.json();

                    // only add the movie if it has a valid title in omdb
                    if (movieData && movieData.Title) {
                        moviesCache[title] = {
                            ...movieData,
                            showtimes: [showtime],
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching OMDB data for ${title}:`, error);
                }
            } else {
                moviesCache[title].showtimes.push(showtime);
            }
        }
        displayMovies();
    }

    // display movies based on the search
    function displayMovies() {
        const searchQuery = document.getElementById("movieSearch").value.toLowerCase();
        const moviesContainer = document.getElementById("moviesContainer");
        moviesContainer.innerHTML = "";

        Object.values(moviesCache)
            .filter(movie => movie.Title.toLowerCase().startsWith(searchQuery))
            .forEach(movie => moviesContainer.appendChild(createMovieCard(movie)));
    }

    // event listeners for html inputs
    document.getElementById("theaterSelect").addEventListener("change", (event) => {
        loadMovies(event.target.value);
    });
    document.getElementById("movieSearch").addEventListener("input", displayMovies);

    // initalizing by loading theaters
    loadTheaters();
