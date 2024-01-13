 document.addEventListener("DOMContentLoaded", function () {
  // DOM element references
  const listBoxContainer = document.getElementById("listBoxContainer");
  const searchForm = document.getElementById("searchForm");
  const countyField = document.getElementById("countyField");
  const streetField = document.getElementById("streetField");
  const zipField = document.getElementById("zipField");
  const countySuggestionsContainer = document.createElement("div");
  countySuggestionsContainer.className = "autocomplete-suggestions";
  const streetSuggestionsContainer = document.createElement("div");
  streetSuggestionsContainer.className = "autocomplete-suggestions";
  const zipSuggestionsContainer = document.createElement("div");
  zipSuggestionsContainer.className = "autocomplete-suggestions";

  if (streetField.style.display === "none") {
    streetField.value = "";
    listBoxContainer.style.display = "none";
  }

  if (zipField.style.display === "none") {
    zipField.value = "";
  }

  // Append autocomplete containers near respective input fields
  countyField.parentNode.appendChild(countySuggestionsContainer);
  streetField.parentNode.appendChild(streetSuggestionsContainer);
  zipField.parentNode.appendChild(zipSuggestionsContainer);

  // Global variables
  let currentCsvData = null;
  let jsonZipCodesGlobal = [];

  const counties = [
    "ADAIR",
    "ADAMS",
    "ALLAMAKEE",
    "APPANOOSE",
    "AUDUBON",
    "BENTON",
    "BLACK HAWK",
    "BOONE",
    "BREMER",
    "BUCHANAN",
    "BUENA VISTA",
    "BUTLER",
    "CALHOUN",
    "CARROLL",
    "CASS",
    "CEDAR",
    "CERRO GORDO",
    "CHEROKEE",
    "CHICKASAW",
    "CLARKE",
    "CLAY",
    "CLAYTON",
    "CLINTON",
    "CRAWFORD",
    "DALLAS",
    "DAVIS",
    "DECATUR",
    "DELAWARE",
    "DES MOINES",
    "DICKINSON",
    "DUBUQUE",
    "EMMET",
    "FAYETTE",
    "FLOYD",
    "FRANKLIN",
    "FREMONT",
    "GREENE",
    "GRUNDY",
    "GUTHRIE",
    "HAMILTON",
    "HANCOCK",
    "HARDIN",
    "HARRISON",
    "HENRY",
    "HOWARD",
    "HUMBOLDT",
    "IDA",
    "IOWA",
    "JACKSON",
    "JASPER",
    "JEFFERSON",
    "JOHNSON",
    "JONES",
    "KEOKUK",
    "KOSSUTH",
    "LEE",
    "LINN",
    "LOUISA",
    "LUCAS",
    "LYON",
    "MADISON",
    "MAHASKA",
    "MARION",
    "MARSHALL",
    "MILLS",
    "MITCHELL",
    "MONONA",
    "MONROE",
    "MONTGOMERY",
    "MUSCATINE",
    "O BRIEN",
    "OSCEOLA",
    "PAGE",
    "PALO ALTO",
    "PLYMOUTH",
    "POCAHONTAS",
    "POLK",
    "POTTAWATTAMIE",
    "POWESHIEK",
    "RINGGOLD",
    "SAC",
    "SCOTT",
    "SHELBY",
    "SIOUX",
    "STORY",
    "TAMA",
    "TAYLOR",
    "UNION",
    "VAN BUREN",
    "WAPELLO",
    "WARREN",
    "WASHINGTON",
    "WAYNE",
    "WEBSTER",
    "WINNEBAGO",
    "WINNESHIEK",
    "WOODBURY",
    "WORTH",
    "WRIGHT"
  ];

  // Event listener for form submission
  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    validateAndProcessData();
  });

  // Function to validate and process the data
  async function validateAndProcessData() {
    const county = countyField.value.toUpperCase();
    const street = streetField.value.toUpperCase();
    const zip = zipField.value;
    const isValid = checkCombinationValid(county, street, zip);

    if (isValid) {
      let precinctName = findPrecinctName(county, street, zip);
      // Additional conditions
      try {
        await matchPrecinctDataToCaucusData(precinctName);
        // Additional code after successful data fetching
      } catch (error) {
        console.error("Error:", error);
        // Handle errors here
      }
    } else {
      outlineFieldsWithRed();
    }
  }

  // Function to check if the combination is valid
  function checkCombinationValid(county, street, zip) {
    return currentCsvData.some(
      (row) =>
        row[1].toUpperCase() === county &&
        row[3].toUpperCase() === street &&
        row[2] === zip
    );
  }

  // Show list box
  function showListBox() {
    listBoxContainer.style.display = "flex";
  }

  // Function to find the precinct name
  function findPrecinctName(county, street, zip) {
    const row = currentCsvData.find(
      (row) =>
        row[1].toUpperCase() === county &&
        row[3].toUpperCase() === street &&
        row[2] === zip
    );
    return row ? row[4] : null;
  }

  // Function to outline fields with red
  function outlineFieldsWithRed() {
    [countyField, streetField, zipField].forEach((field) => {
      field.style.outline = "2px solid red";
    });
  }

  // Function to remove red outline
  function removeRedOutline() {
    [countyField, streetField, zipField].forEach((field) => {
      field.style.outline = "";
    });
  }

  // Add event listeners to remove red outline on input change
  [countyField, streetField, zipField].forEach((field) => {
    field.addEventListener("input", removeRedOutline);
  });

  // Function to find the caucus location by precinct
  function findCaucusLocationByPrecinct(caucusLocations, precinctName) {
    for (const county in caucusLocations) {
      const precincts = caucusLocations[county];
      for (let i = 0; i < precincts.length; i++) {
        if (precincts[i].precinct === precinctName) {
          return precincts[i];
        }
      }
    }
    return null;
  }

  // Function to display the caucus location in the listBox
  function displayCaucusLocation(location) {
    const listBox = document.getElementById("listBox");
    if (location) {
      listBox.textContent = `Your caucus location is ${location.site_name} at ${location.site_address}.`;
    } else {
      listBox.textContent =
        "Sorry, no caucus location found for your precinct name.";
    }
    showListBox();
  }

  async function matchPrecinctDataToCaucusData(precinctName) {
    if (!precinctName) return;

    const proxyUrl = "https://http-cors-proxy.p.rapidapi.com/";
    const targetJsonUrl =
      "https://storage.googleapis.com/precinct-location-to-caucus-site-bucket/caucus_locations.json";

    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-RapidAPI-Key": "292883704emsh21726bbc6fd4a72p1f6a3fjsn910151ec0557",
        "X-RapidAPI-Host": "http-cors-proxy.p.rapidapi.com"
      },
      body: JSON.stringify({ url: targetJsonUrl, method: "GET" })
    };

    try {
      const response = await fetch(proxyUrl, options);
      const caucusLocations = await response.json();
      const location = findCaucusLocationByPrecinct(
        caucusLocations,
        precinctName
      );
      if (!location) {
        throw new Error(`Location not found for precinct: ${precinctName}`);
      }
      displayCaucusLocation(location);
    } catch (error) {
      console.error("Error in matchPrecinctDataToCaucusData:", error);
    }
  }

  // County field input event
  countyField.addEventListener("input", function () {
    let inputVal = countyField.value.toUpperCase();
    let suggestions = counties.filter((county) => county.startsWith(inputVal));
    updateCountySuggestions(suggestions, inputVal);

    // If a valid county is selected, load the corresponding CSV and JSON data
    if (counties.includes(inputVal)) {
      loadCsvForCounty(inputVal)
        .then(() => {
          console.log(inputVal + " data loaded");
          // Any additional actions after data is loaded can be placed here
        })
        .catch((error) => {
          console.error(
            "Error loading data for " + inputVal + ": " + error.message
          );
        });
    }
  });

  // Update street suggestions
  // Modify the updateStreetSuggestions function to automatically select the street if only one match is found
  function updateStreetSuggestions(suggestions, inputVal) {
    streetSuggestionsContainer.innerHTML = "";
    if (inputVal === "" || suggestions.length === 0) {
      streetSuggestionsContainer.style.display = "none";
    } else if (suggestions.length === 1) {
      // Automatically select the street if only one match
      streetField.value = suggestions[0][3];
      streetSuggestionsContainer.style.display = "none";
    } else {
      suggestions.forEach(function (suggestion) {
        let div = document.createElement("div");
        div.textContent = suggestion[3];
        div.className = "suggestion-item";
        div.onclick = function () {
          streetField.value = suggestion[3];
          streetSuggestionsContainer.style.display = "none";
        };
        streetSuggestionsContainer.appendChild(div);
      });
      streetSuggestionsContainer.style.display = "block";
    }
  }

  // Update county suggestions
  // Hide street and zip fields initially
  streetField.style.display = "none";
  zipField.style.display = "none";

  // Modify the updateCountySuggestions function
  function updateCountySuggestions(suggestions, inputVal) {
    countySuggestionsContainer.innerHTML = "";
    if (inputVal === "" || suggestions.length === 0) {
      countySuggestionsContainer.style.display = "none";
      streetField.style.display = "none";
      zipField.style.display = "none";
    } else if (suggestions.length === 1) {
      // Automatically select the county if only one match
      countyField.value = suggestions[0];
      loadCsvForCounty(suggestions[0]);
      countySuggestionsContainer.style.display = "none";
      streetField.style.display = "block";
      zipField.style.display = "block";
    } else {
      suggestions.forEach(function (suggestion) {
        let div = document.createElement("div");
        div.textContent = suggestion;
        div.className = "suggestion-item";
        div.onclick = function () {
          countyField.value = suggestion;
          loadCsvForCounty(suggestion);
          countySuggestionsContainer.style.display = "none";
          streetField.style.display = "block";
          zipField.style.display = "block";
        };
        countySuggestionsContainer.appendChild(div);
      });
      countySuggestionsContainer.style.display = "block";
    }
  }

  // Street field input event
  streetField.addEventListener("input", function () {
    let inputVal = streetField.value.toUpperCase();
    let suggestions = currentCsvData.filter((row) =>
      row[3].toUpperCase().startsWith(inputVal)
    );
    updateStreetSuggestions(suggestions, inputVal);
  });

  // Zip field input event
  zipField.addEventListener("input", function () {
    let inputVal = zipField.value;
    updateZipSuggestions(inputVal);
  });

  // Update ZIP suggestions
  // Modify the updateZipSuggestions function to automatically select the zip if only one match is found
  function updateZipSuggestions(inputVal) {
    zipSuggestionsContainer.innerHTML = "";
    if (inputVal === "" || !Array.isArray(jsonZipCodesGlobal)) {
      zipSuggestionsContainer.style.display = "none";
      return;
    }

    let filteredZipCodes = jsonZipCodesGlobal.filter((zip) =>
      zip.toString().startsWith(inputVal)
    );

    if (filteredZipCodes.length === 0) {
      zipSuggestionsContainer.style.display = "none";
    } else if (filteredZipCodes.length === 1) {
      // Automatically select the zip if only one match
      zipField.value = filteredZipCodes[0];
      zipSuggestionsContainer.style.display = "none";
    } else {
      filteredZipCodes.forEach(function (zipCode) {
        let div = document.createElement("div");
        div.textContent = zipCode;
        div.className = "suggestion-item";
        div.onclick = function () {
          zipField.value = zipCode;
          zipSuggestionsContainer.style.display = "none";
        };
        zipSuggestionsContainer.appendChild(div);
      });
      zipSuggestionsContainer.style.display = "block";
    }
  }

  // Load CSV and JSON for a county
  async function loadCsvForCounty(countyName) {
    const proxyUrl = "https://http-cors-proxy.p.rapidapi.com/";
    const csvUrl = `https://storage.googleapis.com/county_level_precinct_data/${countyName.toUpperCase()}_precinct_data.csv`;
    const jsonUrl = `https://storage.googleapis.com/county_level_precinct_data/${countyName.toUpperCase()}_precinct_data_zips.json`;

    const csvFetchOptions = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-RapidAPI-Key": "292883704emsh21726bbc6fd4a72p1f6a3fjsn910151ec0557",
        "X-RapidAPI-Host": "http-cors-proxy.p.rapidapi.com"
      },
      body: JSON.stringify({ url: csvUrl, method: "GET" })
    };

    const jsonFetchOptions = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-RapidAPI-Key": "292883704emsh21726bbc6fd4a72p1f6a3fjsn910151ec0557",
        "X-RapidAPI-Host": "http-cors-proxy.p.rapidapi.com"
      },
      body: JSON.stringify({ url: jsonUrl, method: "GET" })
    };

    try {
      const csvResponse = await fetch(
        proxyUrl,
        csvFetchOptions
      ).then((response) => response.text());
      const jsonResponse = await fetch(
        proxyUrl,
        jsonFetchOptions
      ).then((response) => response.json());

      console.log("CSV loaded successfully");
      console.log("JSON loaded successfully");
      currentCsvData = parseCsv(csvResponse);
      jsonZipCodesGlobal = jsonResponse;

      // Display street and zip fields only after successful data loading
      streetField.style.display = "block";
      zipField.style.display = "block";
      updateStreetAndZipOptions(currentCsvData, jsonZipCodesGlobal);
    } catch (error) {
      console.error("Error loading CSV or JSON:", error.message);
    }
  }

  // Parse CSV text
  function parseCsv(csvText) {
    const lines = csvText.split("\n").filter((line) => line.trim());
    return lines.map((line) => line.split(",").map((cell) => cell.trim()));
  }

  // Update street and ZIP options
  function updateStreetAndZipOptions(csvData, jsonZipCodes) {
    const streets = new Set();
    csvData.forEach(
      ([precinctShortName, county, zip, street, precinctName], index) => {
        if (index > 0) {
          // Skip header row
          streets.add(street);
        }
      }
    );
    streetField.innerHTML = Array.from(streets)
      .map((street) => `<option value="${street}">${street}</option>`)
      .join("");
    zipField.innerHTML = jsonZipCodes
      .map((zip) => `<option value="${zip}">${zip}</option>`)
      .join("");
  }
});