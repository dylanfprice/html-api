let peopleCounter = 1;
const data = {
	people: [
		{
			id: peopleCounter.toString(),
			name: "Dylan Price",
			phones: [
				{label: "Home", number: "123-456-7890"}
			],
			address: {
				line_1: "1111 11th St",
				line_2: "",
				city: "Bellingham",
				state: "WA",
				zip: "98226",
			}
		}
	]
}
peopleCounter++;

const emptyPerson = {
	name: "",
	phones: [],
	address: {
		line_1: "",
		line_2: "",
		city: "",
		state: "",
		zip: "",
	}
}

function mockServer() {
	const server = sinon.fakeServer.create({autoRespond: true});

	server.respondWith("GET", "/html-api/people", function (xhr) {
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
      <api-data>
        ${input({
				type: "number",
				disabled: true,
				name: "count",
				value: data.people.length,
			})}
      </api-data>
      ${data.people.map(person => (
				`<p><a rel="item" href="/html-api/people/${person.id}">${person.id}: ${person.name}</a></p>`
			)).join('')}
			<p><a rel="create-form" href="/html-api/people?form=create">Create person</a></p>
      `,
		)
	});

	server.respondWith("GET", /\/html-api\/people\/(\d+)/, function (xhr, id) {
		const person = data.people.find(person => person.id === id);
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
      <api-data>
        ${personInputs(person, disabled = true)}
      </api-data>
			<p><a rel="self" href="/html-api/people/${id}">Self</a></p>
			<p><a rel="edit-form" href="/html-api/people/${id}?form=edit">Edit person</a></p>
			${person.phones.length > 0 ? (
				`
			    <p>
						<a rel="/html-api/rel/send-message" 
						   href="/html-api/people/${id}?form=send-message"
						>
						  Send message
						</a>
					</p>
					`
			) : ""
			}
			<p><a rel="collection" href="/html-api/people">Go to collection</a></p>
      `,
		);
	});

	server.respondWith("GET", "/html-api/people?form=create", function (xhr) {
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
      <form hx-post="/html-api/people">
        ${personInputs(emptyPerson, disabled = false)}
        <input type="submit" />
      </form>
      `
		);
	});

	server.respondWith("GET", /\/html-api\/people\?form=phone&index=(\d+)/, function (xhr, index) {
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
        ${input({
				type: "text",
				disabled: false,
				name: `phones[${index}].label`,
				value: "",
			})}
        ${input({
				type: "text",
				disabled: false,
				name: `phones[${index}].number`,
				value: "",
			})}
        ${addPhoneButton(index + 1)}
        `
		)
	});

	server.respondWith("GET", /\/html-api\/people\/(\d+)\?form=edit/, function (xhr, id) {
		const person = data.people.find(person => person.id === id);
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
      <form hx-put="/html-api/people/${person.id}">
      ${personInputs(person, disabled = false)}
      <input type="submit" />
      </form >
      `
		);
	});

	server.respondWith("GET", /\/html-api\/people\/(\d+)\?form=send-message/, function (xhr, id) {
		const person = data.people.find(person => person.id === id);
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
      <form hx-post="/html-api/people/${person.id}/send-message">
				<label for="phone">Choose a phone:</label>
				<select name="phone">
				  ${person.phones.map(phone => (
				`<option value="${phone.number}">${phone.label}</option>`
			))}
				</select>
				${input({
				type: "textarea",
				disabled: false,
				name: "message",
				value: "",
			})}
				<input type="submit" />
      </form >
      `
		);
	});

	server.respondWith("POST", "/html-api/people", function (xhr) {
		const object = paramsToObject(xhr.requestBody)
		if (!("phones" in object)) {
			object.phones = [];
		}
		object.id = peopleCounter.toString();
		peopleCounter++;
		data.people.push(object);
		xhr.respond(
			201,
			{Location: `/html-api/people/${object.id}`, "HX-Location": `/html-api/people/${object.id}`},
			""
		)
	});

	server.respondWith("PUT", /\/html-api\/people\/(\d+)/, function (xhr, id) {
		const object = paramsToObject(xhr.requestBody)
		object.id = id;
		const index = data.people.findIndex(person => person.id === id);
		data.people[index] = object;
		xhr.respond(
			204,
			{Location: `/html-api/people/${object.id}`, "HX-Location": `/html-api/people/${object.id}`},
			""
		)
	});

	server.respondWith("POST", /\/html-api\/people\/(\d+)\/send-message/, function (xhr, id) {
		const object = paramsToObject(xhr.requestBody)
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
				<label for="message_sent">message_sent</label>
				<input type="checkbox" name="message_sent" checked />
				<api-data>
					${input({
				type: "tel",
				disabled,
				name: "phone",
				value: object.phone,
			})}
				</api-data>
				<p><a rel="collection" href="/html-api/people">View all people</a></p>
			`
		)
	});

	server.respondWith("GET", "/html-api/rel/send-message", function (xhr) {
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`<p><code>send-message</code> refers to a form that can be used to send a user a message.</p>`
		)
	})
}

function paramsToObject(paramsString) {
	const params = new URLSearchParams(paramsString)
	const object = {}
	for (const [key, value] of params) {
		if (!key.includes(".")) {
			object[key] = value;
		}
		if (key.includes(".")) {
			let [topkey, subkey] = key.split(".")
			if (topkey.endsWith("]")) {
				const index = topkey.slice(-2, -1)
				topkey = topkey.slice(0, -3)
				if (!(topkey in object)) {
					object[topkey] = []
				}
				if (!(index in object[topkey])) {
					object[topkey][index] = {}
				}
				object[topkey][index][subkey] = value;
			}
			if (!topkey.endsWith("]")) {
				if (!(topkey in object)) {
					object[topkey] = {}
				}
				object[topkey][subkey] = value;
			}
		}
	}
	return object;
}

function personInputs(person, disabled) {
	return `
    ${input({
		type: "text",
		disabled,
		name: "name",
		value: person.name,
	})
		}
    ${person.phones.map((phone, index) => (
			`
      ${input({
				type: "text",
				disabled,
				name: `phones[${index}].label`,
				value: phone.label,
			})}
      ${input({
				type: "tel",
				disabled,
				name: `phones[${index}].number`,
				value: phone.number,
			})}
      `
		)).join('')
		}
    ${!disabled ? addPhoneButton(person.phones.length) : ""}
    ${input({
			type: "text",
			disabled,
			name: "address.line_1",
			value: person.address.line_1,
		})
		}
    ${input({
			type: "text",
			disabled,
			name: "address.line_2",
			value: person.address.line_2,
		})
		}
    ${input({
			type: "text",
			disabled,
			name: "address.city",
			value: person.address.city,
		})
		}
    ${input({
			type: "text",
			disabled,
			name: "address.state",
			value: person.address.state,
		})
		}
    ${input({
			type: "text",
			disabled,
			name: "address.zip",
			value: person.address.zip,
		})
		}
`
}

function input({type, disabled, name, value}) {
	return `
    <div>
      <label for="${name}"> ${name}</label >
      <input
        ${disabled ? "disabled" : ""}
        type="${type}"
        name="${name}"
        value="${value}"
      />
    </div>
`
}

function addPhoneButton(index) {
	return `
    <button hx-swap="outerHTML" hx-get="/html-api/people?form=phone&index=${index}">
    Add phone number
    </button >
  `

}

addEventListener("DOMContentLoaded", mockServer);
