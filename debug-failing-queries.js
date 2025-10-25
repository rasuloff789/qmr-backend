/**
 * Debug failing queries to understand the issues
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

async function debugQueries() {
	console.log("🔍 Debugging failing queries...\n");

	// Test getTeachers
	console.log("1️⃣ Testing getTeachers query...");
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
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: getTeachersQuery }),
	});

	const getTeachersData = await getTeachersResult.json();
	console.log("Response:", JSON.stringify(getTeachersData, null, 2));

	// Test getAdmin
	console.log("\n2️⃣ Testing getAdmin query...");
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

	const getAdminResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: getAdminQuery,
			variables: { id: 1 },
		}),
	});

	const getAdminData = await getAdminResult.json();
	console.log("Response:", JSON.stringify(getAdminData, null, 2));

	// Test getTeacher
	console.log("\n3️⃣ Testing getTeacher query...");
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

	const getTeacherResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: getTeacherQuery,
			variables: { id: 1 },
		}),
	});

	const getTeacherData = await getTeacherResult.json();
	console.log("Response:", JSON.stringify(getTeacherData, null, 2));
}

debugQueries().catch(console.error);
