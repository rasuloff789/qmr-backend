/**
 * Complete workflow test - create user and test all operations
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

async function testCompleteWorkflow() {
	console.log("🚀 Starting Complete Workflow Test\n");

	let results = {
		queries: {},
		mutations: {},
		errors: [],
	};

	// Step 1: Test public queries (no auth required)
	console.log("1️⃣ Testing public queries...");

	// Test me query (no auth)
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
	results.queries.me = {
		success: !!meData.data?.me || meData.data?.me === null,
		data: meData,
	};
	console.log(
		`   ${results.queries.me.success ? "✅" : "❌"} Me query: ${
			results.queries.me.success ? "PASSED" : "FAILED"
		}`
	);

	// Test getAdmins (public)
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
		success: !!getAdminsData.data?.getAdmins,
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

	// Step 2: Create a new admin user (this should work without auth if permissions allow)
	console.log("\n2️⃣ Testing admin creation...");

	const newAdminData = {
		username: "testadmin" + Date.now(),
		password: "testpass123",
		fullname: "Test Admin User",
		birthDate: "1990-01-01",
		phone: "+1234567890",
		tgUsername: "@testadmin",
	};

	const addAdminMutation = `
    mutation AddAdmin($username: String!, $password: String!, $fullname: String!, $birthDate: String!, $phone: String!, $tgUsername: String!) {
      addAdmin(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, phone: $phone, tgUsername: $tgUsername) {
        success
        message
        admin {
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
		success: !!addAdminData.data?.addAdmin?.success,
		data: addAdminData,
	};
	console.log(
		`   ${results.mutations.addAdmin.success ? "✅" : "❌"} Add admin: ${
			results.mutations.addAdmin.success ? "PASSED" : "FAILED"
		}`
	);

	if (addAdminData.data?.addAdmin?.success) {
		console.log(
			`   ✅ Admin created: ${addAdminData.data.addAdmin.admin.username}`
		);
	} else {
		console.log(
			`   ❌ Admin creation failed: ${
				addAdminData.data?.addAdmin?.message ||
				addAdminData.errors?.[0]?.message
			}`
		);
	}

	// Step 3: Login with the new admin
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

	// Step 4: Test authenticated operations
	if (adminToken && adminUser) {
		console.log("\n4️⃣ Testing authenticated operations...");

		// Test me query with auth
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
			success: !!meWithAuthData.data?.me,
			data: meWithAuthData,
		};
		console.log(
			`   ${
				results.queries.meWithAuth.success ? "✅" : "❌"
			} Me query (auth): ${
				results.queries.meWithAuth.success ? "PASSED" : "FAILED"
			}`
		);

		// Test getTeachers (requires auth)
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
			success: !!getTeachersData.data?.getTeachers,
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

		// Test getAdmin (specific)
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
			success: !!getAdminData.data?.getAdmin,
			data: getAdminData,
		};
		console.log(
			`   ${results.queries.getAdmin.success ? "✅" : "❌"} Get admin: ${
				results.queries.getAdmin.success ? "PASSED" : "FAILED"
			}`
		);

		// Test addTeacher mutation
		console.log("   🔄 Testing addTeacher mutation...");
		const addTeacherMutation = `
      mutation AddTeacher($username: String!, $password: String!, $fullname: String!, $birthDate: String!, $phone: String!, $tgUsername: String!, $department: String!) {
        addTeacher(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, phone: $phone, tgUsername: $tgUsername, department: $department) {
          success
          message
          teacher {
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
					password: "testpass123",
					fullname: "Test Teacher",
					birthDate: "1985-05-15",
					phone: "+1234567891",
					tgUsername: "@testteacher",
					department: "Computer Science",
				},
			}),
		});

		const addTeacherData = await addTeacherResult.json();
		results.mutations.addTeacher = {
			success: !!addTeacherData.data?.addTeacher?.success,
			data: addTeacherData,
		};
		console.log(
			`   ${results.mutations.addTeacher.success ? "✅" : "❌"} Add teacher: ${
				results.mutations.addTeacher.success ? "PASSED" : "FAILED"
			}`
		);

		if (addTeacherData.data?.addTeacher?.success) {
			console.log(
				`   ✅ Teacher created: ${addTeacherData.data.addTeacher.teacher.username}`
			);
		} else {
			console.log(
				`   ❌ Teacher creation failed: ${
					addTeacherData.data?.addTeacher?.message ||
					addTeacherData.errors?.[0]?.message
				}`
			);
		}
	}

	// Summary
	console.log("\n📊 Test Summary:");
	console.log("================");

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

	console.log("\n🎉 Complete workflow test finished!");
}

testCompleteWorkflow().catch((error) => {
	console.error("❌ Test execution failed:", error);
	process.exit(1);
});
