const WORD_OF_THE_DAY_URL = "https://words.dev-apis.com/word-of-the-day";
const VALIDATE_WORD_URL = "https://words.dev-apis.com/validate-word";
const total_allowed_guesses = document.querySelectorAll(".guess-row").length;
let WORD_TO_GUESS = ``;
let active_guess_row_index = 0;

async function getTheWord() {
    const promise = await fetch(WORD_OF_THE_DAY_URL);
    const processedResponse = await promise.json();
    return processedResponse.word.toUpperCase();
}

async function validateWord(word_to_validate) {
    const promise = await fetch(VALIDATE_WORD_URL, {
        method: "POST",
        body: JSON.stringify({
            word: word_to_validate,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });
    const processedResponse = await promise.json();
    return processedResponse.validWord;
}

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

function disableInactiveInputs(all_inputs = false) {
    const allInputs = document.querySelectorAll(".letter-box");
    allInputs.forEach((input) => {
        input.disabled = true;
    });
    if (all_inputs === false) {
        const activeInputs = document
            .querySelectorAll(".guess-row")
            [active_guess_row_index].querySelectorAll(".letter-box");
        activeInputs.forEach((input) => {
            input.disabled = false;
        });
    }
}

function attachEventListenersToActiveRow() {
    const inputs = document
        .querySelectorAll(".guess-row")
        [active_guess_row_index].querySelectorAll(".letter-box");

    inputs.forEach((input, input_index) => {
        input.addEventListener("keydown", function (e) {
            if (isLetter(e.key)) {
                e.preventDefault();
                input.value = e.key.toUpperCase();
                if (input.value.length === input.maxLength) {
                    const nextInput = inputs[input_index + 1];
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        document.querySelector(".submit")?.focus();
                    }
                }
            } else if (e.key === "Backspace" && input.value !== "") {
                input.value = "";
            } else if (
                e.key === "Backspace" &&
                input.value === "" &&
                input_index > 0
            ) {
                inputs[input_index - 1].focus();
            } else if (!isLetter(e.key)) {
                e.preventDefault();
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    attachEventListenersToActiveRow();
});

function isGuessCorrect(submitted_guess) {
    if (submitted_guess === WORD_TO_GUESS) {
        disableInactiveInputs(true);
        return true;
    }
    return false;
}

function compareLettersAndUpdateColor(submitted_guess) {
    let correct_place = [];
    let incorrect_place = [];
    let word_to_guess_array = WORD_TO_GUESS.split("");

    for (let i = 0; i < WORD_TO_GUESS.length; i++) {
        if (submitted_guess[i] === WORD_TO_GUESS[i]) {
            correct_place.push(i);
            word_to_guess_array[i] = null;
        }
    }

    for (let i = 0; i < word_to_guess_array.length; i++) {
        if (
            submitted_guess[i] !== WORD_TO_GUESS[i] &&
            word_to_guess_array.includes(submitted_guess[i])
        ) {
            incorrect_place.push(i);
            word_to_guess_array[
                word_to_guess_array.indexOf(submitted_guess[i])
            ] = null;
        }
    }
    correct_place.forEach(function (i) {
        document
            .querySelectorAll(".guess-row")
            [active_guess_row_index].querySelectorAll(".letter-box")
            [i].classList.add("correct-place");
    });
    incorrect_place.forEach(function (i) {
        document
            .querySelectorAll(".guess-row")
            [active_guess_row_index].querySelectorAll(".letter-box")
            [i].classList.add("incorrect-place");
    });
}

function updateGuessedRow() {
    active_guess_row_index += 1;
    setTimeout(() => {
        document
            .querySelectorAll(".guess-row")
            [active_guess_row_index].querySelectorAll(".letter-box")[0]
            .focus();
    }, 0);
    attachEventListenersToActiveRow();
    disableInactiveInputs();
}

document
    .querySelector(".submit")
    .addEventListener("click", async function (event) {
        let submitted_guess = "";
        let is_word_5_letter = true;
        let is_word_valid = false;
        const inputs = document
            .querySelectorAll(".guess-row")
            [active_guess_row_index].querySelectorAll(".letter-box");

        inputs.forEach((input, input_index) => {
            submitted_guess += input.value;
            if (input.value === "") {
                is_word_5_letter = false;
            }
        });

        if (is_word_5_letter !== true) {
            showToast("Invalid word. Need to have a 5 letter word.");
        } else {
            is_word_valid = await validateWord(submitted_guess);
            if (is_word_valid !== true) {
                showToast("Invalid word. Word not agreed by the dictionary.");
            } else {
                compareLettersAndUpdateColor(submitted_guess);
                updateGuessedRow();
                setTimeout(function () {
                    if (isGuessCorrect(submitted_guess) === false) {
                        if (active_guess_row_index >= total_allowed_guesses) {
                            showToast(
                                `Uh oh! You were not able to guess the word, this time... the word was ${WORD_TO_GUESS}`
                            );
                        }
                    } else {
                        document.querySelector(".submit").disabled = true;
                        showToast(
                            `🎊 You guessed it right 🎊<br>That too in only ${active_guess_row_index} ${
                                active_guess_row_index === 1
                                    ? "attempt"
                                    : "attempts"
                            }!`
                        );
                    }
                }, 0);
            }
        }
    });

async function init() {
    WORD_TO_GUESS = await getTheWord();
    validateWord(WORD_TO_GUESS);
    disableInactiveInputs();
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("show");
    }, 0);
    setTimeout(() => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
}

init();
