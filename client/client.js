(function () {

  var button = document.querySelector('button');
  var first = document.querySelector('#first');
  var second = document.querySelector('#second');
  var headers = document.querySelector('#headers');
  var body = document.querySelector('#body');

  button.addEventListener('click', start);
  first.value = 'http://reqr.es/api/users?page=1'
  second.value = 'http://httpbin.org/xml'

  function prettyPrint (response) {
    try {
      return JSON.stringify(JSON.parse(response), null, '\t');
    }
    catch (e) {
      return response;
    }
  }

  function request (url, cb) {
    var xhr = new XMLHttpRequest();
    var res = {};
    xhr.open('GET', url, true);
    xhr.onload = function (evt) {
      // res.response = xhr.response;
      cb(null, xhr.response);
    };
    xhr.onerror = function (evt) {
      throw new Error(xhr.statusText);
    };
    xhr.send();
  }

  function compare (first, second, element) {
    var diff = JsDiff.diffLines(first, second);
    diff.forEach(function(part){
      // green for additions, red for deletions
      // grey for common parts
      var color;
      var color = part.added ? 'green' :
        part.removed ? 'red' : 'grey';
      var span = document.createElement('span');
      span.style.color = color;
      span.appendChild(document
          .createTextNode(part.value));
      element.appendChild(span);
    });
  }

  function start () {
    headers.innerHTML = '';
    body.innerHTML = '';
    var firstURL = first.value;
    var secondURL = second.value;
    var url = '/proxy?url1=' + firstURL + '&url2=' + secondURL;
    request(url, function (err, res) {
      var data = JSON.parse(res);
      compare(prettyPrint(data.first.body),
              prettyPrint(data.second.body),
              body);
    });
    // request(firstURL, function (firstRes) {
    //   request(secondURL, function (secondRes) {
    //     compare(firstRes.headers, secondRes.headers, headers);
    //     compare(firstRes.responsePretty, secondRes.responsePretty, body);
    //   });
    // });
  }

})();