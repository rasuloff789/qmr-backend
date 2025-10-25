/**
 * QMR Backend - Comprehensive GraphQL Operations Test
 *
 * Tests all queries and mutations to ensure they work correctly
 * after the resolver restructuring.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

// Test data
const testData = {
	admin: {
		username: "testadmin",
		password: "testpass123",
		fullname: "Test Admin",
		birthDate: "1990-01-01",
		phone: "+1234567890",
		tgUsername: "@testadmin",
	},
	teacher: {
		username: "testteacher",
		password: "testpass123",
		fullname: "Test Teacher",
		birthDate: "1985-05-15",
		phone: "+1234567891",
		tgUsername: "@testteacher",
		department: "Computer Science",
	},
};

/**
 * Execute GraphQL operation
 */
async function executeGraphQL(operation, variables = {}, token = null) {
	const headers = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers,
			body: JSON.stringify({
				query: operation,
				variables,
			}),
		});

		const result = await response.json();
		return { success: response.ok, data: result, status: response.status };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * Test all operations
 */
async function testAllOperations() {
	console.log("🚀 Starting Comprehensive GraphQL Operations Test\n");

	let results = {
		queries: {},
		mutations: {},
		errors: [],
	};

	// Test 1: Me Query (without authentication)
	console.log("1️⃣ Testing me query (no auth)...");
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

	const meResult = await executeGraphQL(meQuery);
	results.queries.me = meResult;
	console.log(
		`   ${meResult.success ? "✅" : "❌"} Me query: ${
			meResult.success ? "PASSED" : "FAILED"
		}`
	);
	if (!meResult.success) {
		console.log(
			`   Error: ${meResult.error || meResult.data?.errors?.[0]?.message}`
		);
	}

	// Test 2: Login as Admin
	console.log("\n2️⃣ Testing admin login...");
	const adminLoginMutation = `
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

	const adminLoginResult = await executeGraphQL(adminLoginMutation, {
		username: testData.admin.username,
		password: testData.admin.password,
		userType: "admin",
	});

	results.mutations.adminLogin = adminLoginResult;
	console.log(
		`   ${adminLoginResult.success ? "✅" : "❌"} Admin login: ${
			adminLoginResult.success ? "PASSED" : "FAILED"
		}`
	);

	let adminToken = null;
	if (adminLoginResult.success && adminLoginResult.data?.data?.login?.token) {
		adminToken = adminLoginResult.data.data.login.token;
		console.log(
			`   🔑 Admin token obtained: ${adminToken.substring(0, 20)}...`
		);
	}

	// Test 3: Me Query (with admin authentication)
	if (adminToken) {
		console.log("\n3️⃣ Testing me query (with admin auth)...");
		const meWithAuth = await executeGraphQL(meQuery, {}, adminToken);
		results.queries.meWithAuth = meWithAuth;
		console.log(
			`   ${meWithAuth.success ? "✅" : "❌"} Me query (auth): ${
				meWithAuth.success ? "PASSED" : "FAILED"
			}`
		);
	}

	// Test 4: Get Admins
	console.log("\n4️⃣ Testing getAdmins query...");
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

	const getAdminsResult = await executeGraphQL(getAdminsQuery);
	results.queries.getAdmins = getAdminsResult;
	console.log(
		`   ${getAdminsResult.success ? "✅" : "❌"} Get admins: ${
			getAdminsResult.success ? "PASSED" : "FAILED"
		}`
	);

	// Test 5: Get Teachers
	console.log("\n5️⃣ Testing getTeachers query...");
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

	const getTeachersResult = await executeGraphQL(getTeachersQuery);
	results.queries.getTeachers = getTeachersResult;
	console.log(
		`   ${getTeachersResult.success ? "✅" : "❌"} Get teachers: ${
			getTeachersResult.success ? "PASSED" : "FAILED"
		}`
	);

	// Test 6: Add Admin (with admin token)
	if (adminToken) {
		console.log("\n6️⃣ Testing addAdmin mutation...");
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

		const addAdminResult = await executeGraphQL(
			addAdminMutation,
			{
				username: "newadmin",
				password: "newpass123",
				fullname: "New Admin",
				birthDate: "1992-03-15",
				phone: "+1234567892",
				tgUsername: "@newadmin",
			},
			adminToken
		);

		results.mutations.addAdmin = addAdminResult;
		console.log(
			`   ${addAdminResult.success ? "✅" : "❌"} Add admin: ${
				addAdminResult.success ? "PASSED" : "FAILED"
			}`
		);
	}

	// Test 7: Add Teacher (with admin token)
	if (adminToken) {
		console.log("\n7️⃣ Testing addTeacher mutation...");
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

		const addTeacherResult = await executeGraphQL(
			addTeacherMutation,
			{
				username: "newteacher",
				password: "newpass123",
				fullname: "New Teacher",
				birthDate: "1988-07-20",
				phone: "+1234567893",
				tgUsername: "@newteacher",
				department: "Mathematics",
			},
			adminToken
		);

		results.mutations.addTeacher = addTeacherResult;
		console.log(
			`   ${addTeacherResult.success ? "✅" : "❌"} Add teacher: ${
				addTeacherResult.success ? "PASSED" : "FAILED"
			}`
		);
	}

	// Test 8: Login as Teacher
	console.log("\n8️⃣ Testing teacher login...");
	const teacherLoginResult = await executeGraphQL(adminLoginMutation, {
		username: testData.teacher.username,
		password: testData.teacher.password,
		userType: "teacher",
	});

	results.mutations.teacherLogin = teacherLoginResult;
	console.log(
		`   ${teacherLoginResult.success ? "✅" : "❌"} Teacher login: ${
			teacherLoginResult.success ? "PASSED" : "FAILED"
		}`
	);

	let teacherToken = null;
	if (
		teacherLoginResult.success &&
		teacherLoginResult.data?.data?.login?.token
	) {
		teacherToken = teacherLoginResult.data.data.login.token;
		console.log(
			`   🔑 Teacher token obtained: ${teacherToken.substring(0, 20)}...`
		);
	}

	// Test 9: Get Specific Admin
	console.log("\n9️⃣ Testing getAdmin query...");
	const getAdminQuery = `
    query GetAdmin($id: Int!) {
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

	const getAdminResult = await executeGraphQL(getAdminQuery, { id: 1 });
	results.queries.getAdmin = getAdminResult;
	console.log(
		`   ${getAdminResult.success ? "✅" : "❌"} Get admin: ${
			getAdminResult.success ? "PASSED" : "FAILED"
		}`
	);

	// Test 10: Get Specific Teacher
	console.log("\n🔟 Testing getTeacher query...");
	const getTeacherQuery = `
    query GetTeacher($id: Int!) {
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

	const getTeacherResult = await executeGraphQL(getTeacherQuery, { id: 1 });
	results.queries.getTeacher = getTeacherResult;
	console.log(
		`   ${getTeacherResult.success ? "✅" : "❌"} Get teacher: ${
			getTeacherResult.success ? "PASSED" : "FAILED"
		}`
	);

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

	console.log("\n🎉 Test completed!");
}

// Run the tests
testAllOperations().catch((error) => {
	console.error("❌ Test execution failed:", error);
	process.exit(1);
});
