(function () {

  let button = document.querySelector('button');
  let first = document.querySelector('.js-first');
  let second = document.querySelector('.js-second');
  let headers = document.querySelector('.js-headers');
  let body = document.querySelector('.js-body');

  const animateIntro = () => {
    let elems = document.querySelectorAll('.is-animated');
    [...elems].forEach((el) => el.classList.remove('is-animated'));
    first.classList.add('inputs-url--red');
    second.classList.add('inputs-url--green');
  };

  const prettyPrint = (response) => {
    try {
      return JSON.stringify(JSON.parse(response), null, '\t');
    }
    catch (e) { return response; }
  }

  const request = (url, cb) => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function (evt) {
      animateIntro();
      cb(null, xhr.response);
    };
    xhr.onerror = function (evt) {
      throw new Error(xhr.statusText);
    };
    xhr.send();
  }

  const compare = (first, second, element) => {
    let diff = JsDiff.diffLines(first, second);
    let frag = document.createDocumentFragment();

    diff.forEach(function (part){
      let classes = ['diff-line'];
      if (part.added) classes.push('diff-line--green');
      else if (part.removed) classes.push('diff-line--red');

      let span = document.createElement('span');
      classes.forEach((c) => span.classList.add(c));

      span.appendChild(document.createTextNode(part.value));
      frag.appendChild(span);
    });

    element.appendChild(frag);
  }

  const start = () => {
    let firstURL = first.value;
    let secondURL = second.value;
    let url = `/proxy?url1=${firstURL}&url2=${secondURL}`;

    headers.innerHTML = '';
    body.innerHTML = '';

    request(url, function (err, res) {
      let data = JSON.parse(res);
      compare(prettyPrint(data.first.headers),
              prettyPrint(data.second.headers),
              headers);
      compare(prettyPrint(data.first.body),
              prettyPrint(data.second.body),
              body);
    });
  }

  button.addEventListener('click', start);
  first.value = 'http://reqr.es/api/users?page=1';
  second.value = 'http://reqr.es/api/users?page=3';

})();