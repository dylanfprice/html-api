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
	phones: [
		{label: "", number: ""}
	],
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

	server.respondWith("GET", "/people", function (xhr) {
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
			<api-data>
				<input type="number" name="count" value="${data.people.length}" />
			</api-data>
			${data.people.map(person => (
				`<a rel="item" href="/people/${person.id}">${person.id}</a>`
			))}
			<a rel="create-form" href="/people?form=create">Create person</a>
			`,
		)
	});

	server.respondWith("GET", /\/people\/(\d+)/, function (xhr, id) {
		const person = data.people.find(person => person.id === id);
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
			<api-data>
				${personInputs(person, disabled = true)}
			</api-data>
			<a rel="self" href="/people/${id}">Self</a>
			<a rel="edit-form" href="/people/${id}?form=edit">Edit person</a>
			<a rel="collection" href="/people">Go to collection</a>
			`,
		);
	});

	server.respondWith("GET", "/people?form=create", function (xhr) {
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
			<form hx-post="/people">
				${personInputs(emptyPerson, disabled = false)}
				<input type="submit" />
			</form>
			`
		);
	});

	server.respondWith("GET", /\/people\?form=phone&index=(\d+)/, function (xhr, index) {
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
				disabled,
				name: `phones[${index}].number`,
				value: "",
			})}
				${addPhoneButton(index + 1)}
				`
		)
	});

	server.respondWith("GET", /\/people\/(\d+)\?form=edit/, function (xhr, id) {
		const person = data.people.find(person => person.id === id);
		xhr.respond(
			200,
			{"Content-Type": "text/html"},
			`
			<form hx-put="/people/${person.id}">
			${personInputs(person, disabled = false)}
			<input type="submit" />
			</form >
			`
		);
	});

	server.respondWith("POST", "/people", function (xhr) {
		const object = paramsToObject(xhr.requestBody)
		object.id = peopleCounter.toString();
		peopleCounter++;
		data.people.push(object);
		xhr.respond(
			201,
			{Location: `/people/${object.id}`, "HX-Location": `/people/${object.id}`},
			""
		)
	});

	server.respondWith("PUT", /\/people\/(\d+)/, function (xhr, id) {
		const object = paramsToObject(xhr.requestBody)
		object.id = id;
		const index = data.people.findIndex(person => person.id === id);
		data.people[index] = object;
		xhr.respond(
			204,
			{Location: `/people/${object.id}`, "HX-Location": `/people/${object.id}`},
			""
		)
	});
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
				type: "text",
				disabled,
				name: `phones[${index}].number`,
				value: phone.number,
			})}
			`
		))
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
	  <label for="${name}"> ${name}</label >
		<input
			${disabled ? "disabled" : ""}
			type="${type}"
			name="${name}"
			value="${value}"
		/>
`
}

function addPhoneButton(index) {
	return `
	  <button hx-swap="outerHTML" hx-get="/people?form=phone&index=${index}">
		Add phone number
	  </button >
	`

}

addEventListener("DOMContentLoaded", mockServer);
