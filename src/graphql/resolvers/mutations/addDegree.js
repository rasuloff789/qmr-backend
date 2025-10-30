import { prisma } from "../../../database/index.js";
import {
	createErrorResponse,
	createSuccessResponse,
	createValidationError,
	createConflictError,
	createServerError,
	ERROR_MESSAGES,
} from "../../../utils/errors.js";

/**
 * Add a new degree
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.name - Degree name
 * @param {Object} context - GraphQL context
 * @returns {Object} - AddDegreeResponse with success status and degree data
 */
const addDegree = async (_parent, { name }) => {
	try {
		// Input validation
		if (!name || name.trim().length === 0) {
			return {
				success: false,
				message: "Validation failed",
				degree: null,
				errors: ["Degree name is required"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if degree name already exists
		const existingDegree = await prisma.degree.findUnique({
			where: { name: name.trim() },
		});

		if (existingDegree) {
			return {
				success: false,
				message: "Degree name already exists",
				degree: null,
				errors: [`Degree '${name.trim()}' already exists`],
				timestamp: new Date().toISOString(),
			};
		}

		// Create a new degree in the database
		const newDegree = await prisma.degree.create({
			data: {
				name: name.trim(),
			},
			select: {
				id: true,
				name: true,
				createdAt: true,
			},
		});

		return {
			success: true,
			message: "Degree created successfully",
			degree: newDegree,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Add degree error:", error);
		return {
			success: false,
			message: "Failed to create degree",
			degree: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

/**
 * Update a degree
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.id - Degree ID
 * @param {string} args.name - New degree name
 * @param {Object} context - GraphQL context
 * @returns {Object} - UpdateDegreeResponse with success status and degree data
 */
const updateDegree = async (_parent, { id, name }) => {
	try {
		// Check if degree exists
		const existingDegree = await prisma.degree.findUnique({
			where: { id: parseInt(id) },
		});

		if (!existingDegree) {
			return {
				success: false,
				message: "Degree not found",
				degree: null,
				errors: [`Degree with ID ${id} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Prepare update data
		const updateData = {};

		if (name !== undefined) {
			if (!name || name.trim().length === 0) {
				return {
					success: false,
					message: "Validation failed",
					degree: null,
					errors: ["Degree name cannot be empty"],
					timestamp: new Date().toISOString(),
				};
			}

			// Check if new name already exists
			const nameExists = await prisma.degree.findFirst({
				where: {
					name: name.trim(),
					id: { not: parseInt(id) },
				},
			});

			if (nameExists) {
				return {
					success: false,
					message: "Degree name already exists",
					degree: null,
					errors: [`Degree '${name.trim()}' already exists`],
					timestamp: new Date().toISOString(),
				};
			}

			updateData.name = name.trim();
		}

		// Check if there are any fields to update
		if (Object.keys(updateData).length === 0) {
			return {
				success: false,
				message: "No fields provided to update",
				degree: null,
				errors: ["No fields provided to update"],
				timestamp: new Date().toISOString(),
			};
		}

		// Update the degree
		const updatedDegree = await prisma.degree.update({
			where: { id: parseInt(id) },
			data: updateData,
			select: {
				id: true,
				name: true,
				createdAt: true,
			},
		});

		return {
			success: true,
			message: "Degree updated successfully",
			degree: updatedDegree,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Update degree error:", error);
		return {
			success: false,
			message: "Failed to update degree",
			degree: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

/**
 * Delete a degree
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.id - Degree ID
 * @param {Object} context - GraphQL context
 * @returns {Object} - UpdateDegreeResponse with success status
 */
const deleteDegree = async (_parent, { id }) => {
	try {
		// Check if degree exists
		const existingDegree = await prisma.degree.findUnique({
			where: { id: parseInt(id) },
			include: {
				teachers: true,
			},
		});

		if (!existingDegree) {
			return {
				success: false,
				message: "Degree not found",
				degree: null,
				errors: [`Degree with ID ${id} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// If associated with teachers, disconnect them first
		if (existingDegree.teachers.length > 0) {
			await prisma.degree.update({
				where: { id: parseInt(id) },
				data: {
					teachers: {
						set: [],
					},
				},
			});
		}

		// Delete the degree after disconnection
		await prisma.degree.delete({ where: { id: parseInt(id) } });

		return {
			success: true,
			message: "Degree deleted successfully",
			degree: null,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Delete degree error:", error);
		return {
			success: false,
			message: "Failed to delete degree",
			degree: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addDegree, updateDegree, deleteDegree };
