"use strict";

const personname = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const address = document.getElementById("address");
const items = document.getElementById("items");
const submit = document.getElementById("submit");
const form = document.getElementById("faqs-form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if(personname.value == "" || personname.value == null) {
    alert("Name is required for form completion!");
    return false;
  }
  if(phone.value == "" || phone.value == null) {
    alert("Phone number is required for form completion!");
    return false;
  }
  if(address.value == "" || address.value == null) {
    alert("Address is required for form completion!");
    return false;
  }
  if(items.value == "" || items.value == null) {
    alert("Items requested or purchased is required for form completion!");
    return false;
  }
})
