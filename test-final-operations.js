/**
 * Final comprehensive test with correct schema expectations
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

async function testFinalOperations() {
	console.log("🚀 Starting Final Comprehensive Test\n");

	let results = {
		queries: {},
		mutations: {},
		errors: [],
	};

	// Test 1: Public queries (no auth required)
	console.log("1️⃣ Testing public queries...");

	// Me query (no auth)
	console.log("   📋 Testing me query (no auth)...");
	const meQuery = `
    query {
      me {
        id
        username
        fullname
        role
        createdAt
      }
    }
  `;

	const meResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: meQuery }),
	});

	const meData = await meResult.json();
	results.queries.me = { success: !meData.errors, data: meData };
	console.log(
		`   ${results.queries.me.success ? "✅" : "❌"} Me query: ${
			results.queries.me.success ? "PASSED" : "FAILED"
		}`
	);

	// GetAdmins (public)
	console.log("   📋 Testing getAdmins query (public)...");
	const getAdminsQuery = `
    query {
      getAdmins {
        id
        username
        fullname
        birthDate
        phone
        tgUsername
        isActive
        createdAt
      }
    }
  `;

	const getAdminsResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: getAdminsQuery }),
	});

	const getAdminsData = await getAdminsResult.json();
	results.queries.getAdmins = {
		success: !getAdminsData.errors,
		data: getAdminsData,
	};
	console.log(
		`   ${results.queries.getAdmins.success ? "✅" : "❌"} Get admins: ${
			results.queries.getAdmins.success ? "PASSED" : "FAILED"
		}`
	);
	if (getAdminsData.data?.getAdmins) {
		console.log(
			`   Found ${getAdminsData.data.getAdmins.length} existing admins`
		);
	}

	// Test 2: Create admin (correct schema)
	console.log("\n2️⃣ Testing addAdmin mutation...");

	const newAdminData = {
		username: "testadmin" + Date.now(),
		password: "TestPass123",
		fullname: "Test Admin User",
		birthDate: "1990-01-01",
		phone: "998901234567",
		tgUsername: "testadmin",
	};

	const addAdminMutation = `
    mutation AddAdmin($username: String!, $password: String!, $fullname: String!, $birthDate: Date!, $phone: Phone!, $tgUsername: String!) {
      addAdmin(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, phone: $phone, tgUsername: $tgUsername) {
        id
        username
        fullname
        birthDate
        phone
        tgUsername
        isActive
        createdAt
      }
    }
  `;

	const addAdminResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: addAdminMutation,
			variables: newAdminData,
		}),
	});

	const addAdminData = await addAdminResult.json();
	results.mutations.addAdmin = {
		success: !addAdminData.errors,
		data: addAdminData,
	};
	console.log(
		`   ${results.mutations.addAdmin.success ? "✅" : "❌"} Add admin: ${
			results.mutations.addAdmin.success ? "PASSED" : "FAILED"
		}`
	);

	if (addAdminData.errors) {
		console.log(`   Error: ${addAdminData.errors[0].message}`);
	} else if (addAdminData.data?.addAdmin) {
		console.log(`   ✅ Admin created: ${addAdminData.data.addAdmin.username}`);
	}

	// Test 3: Login with the new admin
	console.log("\n3️⃣ Testing admin login...");

	const loginMutation = `
    mutation Login($username: String!, $password: String!, $userType: String!) {
      login(username: $username, password: $password, userType: $userType) {
        success
        message
        token
        user {
          id
          username
          fullname
          role
          createdAt
        }
      }
    }
  `;

	const loginResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: loginMutation,
			variables: {
				username: newAdminData.username,
				password: newAdminData.password,
				userType: "admin",
			},
		}),
	});

	const loginData = await loginResult.json();
	results.mutations.adminLogin = {
		success: !!loginData.data?.login?.success,
		data: loginData,
	};
	console.log(
		`   ${results.mutations.adminLogin.success ? "✅" : "❌"} Admin login: ${
			results.mutations.adminLogin.success ? "PASSED" : "FAILED"
		}`
	);

	let adminToken = null;
	let adminUser = null;

	if (loginData.data?.login?.success) {
		adminToken = loginData.data.login.token;
		adminUser = loginData.data.login.user;
		console.log(
			`   🔑 Admin token obtained: ${adminToken.substring(0, 20)}...`
		);
		console.log(
			`   👤 Logged in as: ${adminUser.username} (${adminUser.role})`
		);
	} else {
		console.log(`   ❌ Login failed: ${loginData.data?.login?.message}`);
	}

	// Test 4: Authenticated operations
	if (adminToken && adminUser) {
		console.log("\n4️⃣ Testing authenticated operations...");

		// Me query with auth
		console.log("   📋 Testing me query (with auth)...");
		const meWithAuthResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${adminToken}`,
			},
			body: JSON.stringify({ query: meQuery }),
		});

		const meWithAuthData = await meWithAuthResult.json();
		results.queries.meWithAuth = {
			success: !meWithAuthData.errors,
			data: meWithAuthData,
		};
		console.log(
			`   ${
				results.queries.meWithAuth.success ? "✅" : "❌"
			} Me query (auth): ${
				results.queries.meWithAuth.success ? "PASSED" : "FAILED"
			}`
		);

		// GetTeachers (requires auth)
		console.log("   📋 Testing getTeachers query...");
		const getTeachersQuery = `
      query {
        getTeachers {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          department
          createdAt
        }
      }
    `;

		const getTeachersResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${adminToken}`,
			},
			body: JSON.stringify({ query: getTeachersQuery }),
		});

		const getTeachersData = await getTeachersResult.json();
		results.queries.getTeachers = {
			success: !getTeachersData.errors,
			data: getTeachersData,
		};
		console.log(
			`   ${results.queries.getTeachers.success ? "✅" : "❌"} Get teachers: ${
				results.queries.getTeachers.success ? "PASSED" : "FAILED"
			}`
		);

		if (getTeachersData.errors) {
			console.log(`   Error: ${getTeachersData.errors[0].message}`);
		} else if (getTeachersData.data?.getTeachers) {
			console.log(
				`   Found ${getTeachersData.data.getTeachers.length} teachers`
			);
		}

		// GetAdmin (specific)
		console.log("   📋 Testing getAdmin query...");
		const getAdminQuery = `
      query GetAdmin($id: ID!) {
        getAdmin(id: $id) {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          isActive
          createdAt
        }
      }
    `;

		const getAdminResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${adminToken}`,
			},
			body: JSON.stringify({
				query: getAdminQuery,
				variables: { id: adminUser.id },
			}),
		});

		const getAdminData = await getAdminResult.json();
		results.queries.getAdmin = {
			success: !getAdminData.errors,
			data: getAdminData,
		};
		console.log(
			`   ${results.queries.getAdmin.success ? "✅" : "❌"} Get admin: ${
				results.queries.getAdmin.success ? "PASSED" : "FAILED"
			}`
		);

		// GetTeacher (specific)
		console.log("   📋 Testing getTeacher query...");
		const getTeacherQuery = `
      query GetTeacher($id: ID!) {
        getTeacher(id: $id) {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          department
          createdAt
        }
      }
    `;

		const getTeacherResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${adminToken}`,
			},
			body: JSON.stringify({
				query: getTeacherQuery,
				variables: { id: "1" },
			}),
		});

		const getTeacherData = await getTeacherResult.json();
		results.queries.getTeacher = {
			success: !getTeacherData.errors,
			data: getTeacherData,
		};
		console.log(
			`   ${results.queries.getTeacher.success ? "✅" : "❌"} Get teacher: ${
				results.queries.getTeacher.success ? "PASSED" : "FAILED"
			}`
		);

		// AddTeacher mutation
		console.log("   🔄 Testing addTeacher mutation...");
		const addTeacherMutation = `
      mutation AddTeacher($username: String!, $password: String!, $fullname: String!, $birthDate: Date!, $phone: Phone!, $tgUsername: String!, $department: String!) {
        addTeacher(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, phone: $phone, tgUsername: $tgUsername, department: $department) {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          department
          createdAt
        }
      }
    `;

		const addTeacherResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${adminToken}`,
			},
			body: JSON.stringify({
				query: addTeacherMutation,
				variables: {
					username: "testteacher" + Date.now(),
					password: "TestPass123",
					fullname: "Test Teacher",
					birthDate: "1985-05-15",
					phone: "998901234568",
					tgUsername: "testteacher",
					department: "Computer Science",
				},
			}),
		});

		const addTeacherData = await addTeacherResult.json();
		results.mutations.addTeacher = {
			success: !addTeacherData.errors,
			data: addTeacherData,
		};
		console.log(
			`   ${results.mutations.addTeacher.success ? "✅" : "❌"} Add teacher: ${
				results.mutations.addTeacher.success ? "PASSED" : "FAILED"
			}`
		);

		if (addTeacherData.errors) {
			console.log(`   Error: ${addTeacherData.errors[0].message}`);
		} else if (addTeacherData.data?.addTeacher) {
			console.log(
				`   ✅ Teacher created: ${addTeacherData.data.addTeacher.username}`
			);
		}
	}

	// Summary
	console.log("\n📊 Final Test Summary:");
	console.log("=====================");

	const queryTests = Object.keys(results.queries);
	const mutationTests = Object.keys(results.mutations);

	let passedQueries = 0;
	let passedMutations = 0;

	console.log("\n📋 Query Results:");
	queryTests.forEach((test) => {
		const result = results.queries[test];
		const status = result.success ? "✅ PASSED" : "❌ FAILED";
		console.log(`   ${test}: ${status}`);
		if (result.success) passedQueries++;
	});

	console.log("\n🔄 Mutation Results:");
	mutationTests.forEach((test) => {
		const result = results.mutations[test];
		const status = result.success ? "✅ PASSED" : "❌ FAILED";
		console.log(`   ${test}: ${status}`);
		if (result.success) passedMutations++;
	});

	console.log(`\n📈 Overall Results:`);
	console.log(`   Queries: ${passedQueries}/${queryTests.length} passed`);
	console.log(
		`   Mutations: ${passedMutations}/${mutationTests.length} passed`
	);
	console.log(
		`   Total: ${passedQueries + passedMutations}/${
			queryTests.length + mutationTests.length
		} passed`
	);

	if (results.errors.length > 0) {
		console.log("\n❌ Errors encountered:");
		results.errors.forEach((error) => console.log(`   - ${error}`));
	}

	console.log("\n🎉 Final test completed!");
}

testFinalOperations().catch((error) => {
	console.error("❌ Test execution failed:", error);
	process.exit(1);
});
