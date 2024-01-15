const name = document.getElementById("name")
const email = document.getElementById("email")
const phone = document.getElementById("phone")
const address = document.getElementById("address")
const items = document.getElementById("items")
const submit = document.getElementById("submit")
const form = document.getElementById("form")

form.addEventListener("submit", (e) => {
  let messages = []
  if(name.value === "" || name.value == null) {
    messages.push("Name is required")
  }

  if(messages.length > 0) {
    e.preventDefault()
    errorElement.innerText = messages.join(", ")
})