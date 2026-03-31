import "core-js/stable";
import "./pages/index.css";
import {
  enableValidation,
  resetValidation,
  settings,
} from "./components/validation.js";
import Api from "./components/Api.js";

import logoSrc from "./images/logo.svg";
import defaultAvatarSrc from "./images/avatar.jpg";
import pencilSrc from "./images/pencil.svg";
import plusSrc from "./images/plus.svg";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "ff51ac54-861a-45e3-9cf3-9d81d572c4a2",
    "Content-Type": "application/json",
  },
});

enableValidation(settings);

const headerLogo = document.querySelector(".header__logo");
const profileAvatar = document.querySelector(".profile__avatar");
const profileAvatarBtn = document.querySelector(".profile__avatar-btn");
const profileAvatarEditIcon = document.querySelector(
  ".profile__avatar-edit-icon",
);
const editIcon = document.querySelector(".profile__edit-icon");
const newPostIcon = document.querySelector(".profile__new-post-icon");

headerLogo.src = logoSrc;
profileAvatar.src = defaultAvatarSrc;
profileAvatarEditIcon.src = pencilSrc;
editIcon.src = pencilSrc;
newPostIcon.src = plusSrc;

const cardsList = document.querySelector(".cards__list");
const cardTemplate = document.querySelector("#card-template").content;

const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");

const editProfileBtn = document.querySelector(".profile__edit-btn");
const newPostBtn = document.querySelector(".profile__new-post-btn");

const editProfileModal = document.querySelector("#edit-profile-modal");
const newPostModal = document.querySelector("#new-post-modal");
const editAvatarModal = document.querySelector("#edit-avatar-modal");
const deleteCardModal = document.querySelector("#delete-card-modal");
const imageModal = document.querySelector("#image-modal");

const previewImage = imageModal.querySelector(".modal__image");
const previewCaption = imageModal.querySelector(".modal__caption");

const editProfileForm = editProfileModal.querySelector(".modal__form");
const newPostForm = newPostModal.querySelector(".modal__form");
const editAvatarForm = editAvatarModal.querySelector(".modal__form");
const deleteCardForm = deleteCardModal.querySelector(".modal__form");

const nameInput = document.querySelector("#profile-name-input");
const descriptionInput = document.querySelector("#profile-description-input");
const imageInput = document.querySelector("#card-image-input");
const captionInput = document.querySelector("#post-caption-input");
const avatarInput = document.querySelector("#profile-avatar-input");

const closeButtons = document.querySelectorAll(".modal__close-btn");
const modals = document.querySelectorAll(".modal");

let currentUserId = "";
let selectedCardId = "";
let selectedCardElement = null;

function handleEscClose(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_is-opened");
    if (openedModal) {
      closeModal(openedModal);
    }
  }
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", handleEscClose);
}

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", handleEscClose);
}

function setButtonText(
  button,
  isLoading,
  defaultText,
  loadingText = "Saving...",
) {
  button.textContent = isLoading ? loadingText : defaultText;
}

function isLiked(cardData) {
  return Boolean(cardData.isLiked);
}

function updateLikeView(likeButton, cardData) {
  if (isLiked(cardData)) {
    likeButton.classList.add("card__like-btn_active");
  } else {
    likeButton.classList.remove("card__like-btn_active");
  }
}

function handleImageClick(cardData) {
  previewImage.src = cardData.link;
  previewImage.alt = cardData.name;
  previewCaption.textContent = cardData.name;
  openModal(imageModal);
}

function handleDeleteClick(cardId, cardElement) {
  selectedCardId = cardId;
  selectedCardElement = cardElement;
  openModal(deleteCardModal);
}

function getCardElement(cardData) {
  const cardElement = cardTemplate.cloneNode(true).querySelector(".card");

  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const likeBtn = cardElement.querySelector(".card__like-btn");
  const deleteBtn = cardElement.querySelector(".card__delete-btn");

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardTitle.textContent = cardData.name;

  updateLikeView(likeBtn, cardData);

  if (cardData.owner !== currentUserId) {
    deleteBtn.remove();
  } else {
    deleteBtn.addEventListener("click", () => {
      handleDeleteClick(cardData._id, cardElement);
    });
  }

  likeBtn.addEventListener("click", () => {
    const request = isLiked(cardData)
      ? api.unlikeCard(cardData._id)
      : api.likeCard(cardData._id);

    request
      .then((updatedCard) => {
        cardData.isLiked = updatedCard.isLiked;
        updateLikeView(likeBtn, cardData);
      })
      .catch(console.error);
  });

  cardImage.addEventListener("click", () => {
    handleImageClick(cardData);
  });

  return cardElement;
}

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    closeModal(modal);
  });
});

modals.forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (evt.target === modal) {
      closeModal(modal);
    }
  });
});

editProfileBtn.addEventListener("click", () => {
  nameInput.value = profileName.textContent;
  descriptionInput.value = profileDescription.textContent;
  resetValidation(editProfileForm, settings);
  openModal(editProfileModal);
});

newPostBtn.addEventListener("click", () => {
  newPostForm.reset();
  resetValidation(newPostForm, settings);
  openModal(newPostModal);
});

profileAvatarBtn.addEventListener("click", () => {
  editAvatarForm.reset();
  resetValidation(editAvatarForm, settings);
  openModal(editAvatarModal);
});

editProfileForm.addEventListener("submit", (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Save");

  api
    .editProfile({
      name: nameInput.value,
      about: descriptionInput.value,
    })
    .then((userData) => {
      profileName.textContent = userData.name || "";
      profileDescription.textContent = userData.about || "";
      closeModal(editProfileModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitButton, false, "Save");
    });
});

newPostForm.addEventListener("submit", (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Save");

  api
    .addCard({
      name: captionInput.value,
      link: imageInput.value,
    })
    .then((cardData) => {
      const cardElement = getCardElement(cardData);
      cardsList.prepend(cardElement);
      newPostForm.reset();
      resetValidation(newPostForm, settings);
      closeModal(newPostModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitButton, false, "Save");
    });
});

editAvatarForm.addEventListener("submit", (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Save");

  api
    .updateAvatar({
      avatar: avatarInput.value,
    })
    .then((userData) => {
      profileAvatar.src = userData.avatar || defaultAvatarSrc;
      profileAvatar.alt = userData.name || "Profile avatar";
      closeModal(editAvatarModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitButton, false, "Save");
    });
});

deleteCardForm.addEventListener("submit", (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  setButtonText(submitButton, true, "Delete", "Deleting...");

  api
    .deleteCard(selectedCardId)
    .then(() => {
      if (selectedCardElement) {
        selectedCardElement.remove();
      }
      selectedCardId = "";
      selectedCardElement = null;
      closeModal(deleteCardModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitButton, false, "Delete");
    });
});

Promise.all([api.getUserInfo(), api.getInitialCards()])
  .then(([userData, cards]) => {
    currentUserId = userData._id || "";

    profileName.textContent = userData.name || "";
    profileDescription.textContent = userData.about || "";
    profileAvatar.src = userData.avatar || defaultAvatarSrc;
    profileAvatar.alt = userData.name || "Profile avatar";

    cards.forEach((cardData) => {
      const cardElement = getCardElement(cardData);
      cardsList.append(cardElement);
    });
  })
  .catch(console.error);
