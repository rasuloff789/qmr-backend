export const studentSelectFields = {
	id: true,
	username: true,
	fullname: true,
	birthDate: true,
	phone: true,
	tgUsername: true,
	gender: true,
	profilePicture: true,
	isActive: true,
	isDeleted: true,
	createdAt: true,
	possibleDegrees: {
		select: {
			id: true,
			name: true,
			createdAt: true,
		},
	},
};

export default studentSelectFields;
