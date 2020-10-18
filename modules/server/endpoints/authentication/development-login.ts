const createRoleCheckbox = (role: string) => {
  return /* html */ `<label><input checked type="checkbox" name="roles" value="${role}" id="${role}">${role}</label></input><br/>`;
};
export function devLoginForm(): string {
  return /* html */ `
  <html>
  <head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.1/css/theme.default.min.css" />
  <style>
    body {
      margin: 1em auto;
      width: fit-content;
      font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    }

    .submit-button {
      cursor: pointer;
      margin: 0.25em;
      padding: 1em;
      border: 1px solid #03a9f4;
      color: #03a9f4;
      font-size: 130%;
      font-weight: bold;
      border-radius: 4px;
      margin-top: 20px;
    }

    .submit-button:hover, .submit-button:active {
      background-color: #03a9f4;
      color: white;
    }
    .username {
      margin-top: 10px;
    }
    .username input {
      margin-left: 3px;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  </head>
  <body>

  <p style="text-align:center"><i>(or go to the <a href="/auth/okta">Okta Login</a>)</i></p>

  <h1>Developer Login!</h1>

  <form style="display: inline" action="/auth/development-login" method="post">
    <div class="username">
    <label>Username: </label><input name="username" value="Tupaca"/><br/>
    <label>Firstname: </label><input name="firstname" value="Tu"/><br/>
    <label>Lastname: </label><input name="lastname" value="Paca"/><br/>
    </div>
    <input type="hidden" name="password" value="spaghetti"/>
    <input type="submit" class="submit-button" value="Log In"/>
  </form>

  <script>
  </script>
  </body>
  </html>
  `;
}
