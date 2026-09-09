self.addEventListener(
  "push",
  function (event) {
    const data = event.data
      ? event.data.json()
      : {};

    const title =
      data.title || "MedShelf";

    const options = {
      body:
        data.body ||
        "You have a medicine reminder.",
      icon: "/favicon.ico",
    };

    event.waitUntil(
      self.registration.showNotification(
        title,
        options
      )
    );
  }
);