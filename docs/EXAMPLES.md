# GraphQL Mutation Misollari

Ushbu hujjat API-ni sinash uchun GraphQL mutation misollarini o'z ichiga oladi.

## Autentifikatsiya va Ruxsatlar

**Muhim:** Quyidagi mutation'lar autentifikatsiya va maxsus rollarni talab qiladi:
- `addCourse` - Faqat **ROOT** va **ADMIN** foydalanuvchilar uchun mavjud
- `updateCourse` - Faqat **ROOT** va **ADMIN** foydalanuvchilar uchun mavjud
- `deleteCourse` - Faqat **ROOT** va **ADMIN** foydalanuvchilar uchun mavjud
- `addStudentToCourse` - Faqat **ROOT** va **ADMIN** foydalanuvchilar uchun mavjud
- `removeStudentFromCourse` - Faqat **ROOT** va **ADMIN** foydalanuvchilar uchun mavjud

Ushbu mutation'lardan foydalanish uchun siz quyidagilarni bajarishingiz kerak:
1. Avval JWT token olish uchun `login` mutation'idan foydalaning
2. Token'ni `Authorization` header'iga qo'shing: `Bearer <your-token>`

### Login Misoli

```graphql
mutation Login {
  login(username: "admin.username", password: "your-password") {
    token
    user {
      id
      username
      role
    }
  }
}
```

## Kurs Qo'shish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

### Asosiy Misol

```graphql
mutation AddCourse {
  addCourse(
    name: "Introduction to Computer Science"
    description: "A comprehensive course covering fundamental computer science concepts"
    daysOfWeek: [MONDAY, WEDNESDAY, FRIDAY]
    gender: MALE
    startAt: "2024-01-15T00:00:00Z"
    endAt: "2024-12-20T00:00:00Z"
    startTime: "2024-01-01T09:00:00Z"
    endTime: "2024-01-01T11:00:00Z"
    teacherId: "1"
    degreeIds: ["1", "2"]
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      gender
      startAt
      endAt
      startTime
      endTime
      teacher {
        id
        fullname
        username
      }
      degrees {
        id
        name
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

### Barcha Maydonlar bilan Misol

```graphql
mutation AddCourseFull {
  addCourse(
    name: "Advanced Mathematics"
    description: "Advanced mathematical concepts including calculus, linear algebra, and statistics"
    daysOfWeek: [TUESDAY, THURSDAY]
    gender: FEMALE
    startAt: "2024-02-01T00:00:00Z"
    endAt: "2024-11-30T00:00:00Z"
    startTime: "2024-01-01T14:00:00Z"
    endTime: "2024-01-01T16:00:00Z"
    teacherId: "2"
    degreeIds: ["3", "4", "5"]
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      gender
      startAt
      endAt
      startTime
      endTime
      teacher {
        id
        fullname
        username
        isActive
      }
      degrees {
        id
        name
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

### CHILD Jinsidagi Kurs Misoli

```graphql
mutation AddChildCourse {
  addCourse(
    name: "Kids Programming Basics"
    description: "Introduction to programming for children aged 8-12"
    daysOfWeek: [SATURDAY, SUNDAY]
    gender: CHILD
    startAt: "2024-03-01T00:00:00Z"
    endAt: "2024-12-31T00:00:00Z"
    startTime: "2024-01-01T10:00:00Z"
    endTime: "2024-01-01T12:00:00Z"
    teacherId: "3"
    degreeIds: ["1"]
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      gender
      startAt
      endAt
      startTime
      endTime
      teacher {
        id
        fullname
      }
      degrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

## Kurs Yangilash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

### Asosiy Misol - Nomi va Tavsifini Yangilash

```graphql
mutation UpdateCourse {
  updateCourse(
    courseId: "1"
    name: "Advanced Computer Science"
    description: "Updated description for the course"
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      gender
      startAt
      endAt
      startTime
      endTime
      teacher {
        id
        fullname
      }
      degrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

### Hafta Kunlarini Yangilash

```graphql
mutation UpdateCourseDays {
  updateCourse(
    courseId: "1"
    daysOfWeek: [TUESDAY, THURSDAY, SATURDAY]
  ) {
    success
    message
    course {
      id
      name
      daysOfWeek
    }
    errors
    timestamp
  }
}
```

### Kurs O'qituvchisi va Darajalarini Yangilash

```graphql
mutation UpdateCourseTeacher {
  updateCourse(
    courseId: "1"
    teacherId: "2"
    degreeIds: ["3", "4"]
  ) {
    success
    message
    course {
      id
      name
      teacher {
        id
        fullname
      }
      degrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

### Bir Nechta Maydonlarni Yangilash

```graphql
mutation UpdateCourseMultiple {
  updateCourse(
    courseId: "1"
    name: "Introduction to Data Science"
    description: "Learn data science fundamentals"
    daysOfWeek: [MONDAY, WEDNESDAY]
    startAt: "2024-02-01T00:00:00Z"
    endAt: "2024-12-31T00:00:00Z"
    startTime: "2024-01-01T10:00:00Z"
    endTime: "2024-01-01T12:00:00Z"
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      startAt
      endAt
      startTime
      endTime
    }
    errors
    timestamp
  }
}
```

### Kurs Jinsini Yangilash

```graphql
mutation UpdateCourseGender {
  updateCourse(
    courseId: "1"
    gender: FEMALE
  ) {
    success
    message
    course {
      id
      name
      gender
    }
    errors
    timestamp
  }
}
```

## Kurs O'chirish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

### Asosiy Misol

```graphql
mutation DeleteCourse {
  deleteCourse(courseId: "1") {
    success
    message
    errors
    timestamp
  }
}
```

### Xato Boshqaruvi bilan Misol

```graphql
mutation DeleteCourseSafe {
  deleteCourse(courseId: "5") {
    success
    message
    errors
    timestamp
  }
}
```

## Talabani Kursga Qo'shish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

### Asosiy Misol

```graphql
mutation AddStudentToCourse {
  addStudentToCourse(
    courseId: "1"
    studentId: "10"
    monthlyPayment: 500000
  ) {
    success
    message
    courseStudent {
      id
      course {
        id
        name
      }
      student {
        id
        fullname
        username
      }
      monthlyPayment
      joinedAt
      isActive
    }
    errors
    timestamp
  }
}
```

## Talabani Kurstdan Olib Tashlash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

### Asosiy Misol

```graphql
mutation RemoveStudentFromCourse {
  removeStudentFromCourse(
    courseId: "1"
    studentId: "10"
  ) {
    success
    message
    errors
    timestamp
  }
}
```

### To'liq Javob bilan Misol

```graphql
mutation RemoveStudentFromCourse {
  removeStudentFromCourse(
    courseId: "3"
    studentId: "106"
  ) {
    success
    message
    errors
    timestamp
  }
}
```

## Eslatmalar

### Hafta Kunlari Variantlari
- `MONDAY`
- `TUESDAY`
- `WEDNESDAY`
- `THURSDAY`
- `FRIDAY`
- `SATURDAY`
- `SUNDAY`

### Jins Variantlari
- `MALE`
- `FEMALE`
- `CHILD`

### Sana Formati
- ISO 8601 formatidan foydalaning: `"2024-01-15T00:00:00Z"`
- Sanalar UTC vaqtida bo'lishi kerak

### Vaqt Formati
- ISO 8601 formatidan foydalaning: `"2024-01-01T09:00:00Z"`
- Vaqt UTC bo'lishi kerak
- Sana qismi muhim emas, faqat vaqt qismi ishlatiladi

### O'qituvchi va Daraja ID'larini Olish

Kurs yaratishdan oldin, siz mavjud o'qituvchilar va darajalarni so'rab olishingiz kerak bo'lishi mumkin:

```graphql
query GetTeachers {
  getTeachers {
    id
    fullname
    username
    gender
    isActive
    degrees {
      id
      name
    }
  }
}

query GetDegrees {
  getDegrees {
    id
    name
  }
}
```

### Umumiy Xatolar

1. **Ruxsat berilmagan / Ruxsat rad etildi**: 
   - ROOT yoki ADMIN hisobi bilan tizimga kirganingizga ishonch hosil qiling
   - JWT token'ingiz Authorization header'ida ekanligini tekshiring
   - Foydalanuvchi rol'ingiz ROOT yoki ADMIN ekanligini tekshiring

2. **O'qituvchi topilmadi yoki faol emas**: `teacherId` mavjudligini va o'qituvchining faol ekanligini tekshiring

3. **Jins mos kelmadi**: O'qituvchining jinsi kurs jinsi bilan mos kelishi kerak

4. **Daraja topilmadi**: Barcha `degreeIds` mavjudligini tekshiring

5. **O'qituvchida kerakli darajalar yo'q**: O'qituvchi `degreeIds`'da ko'rsatilgan kamida bitta darajaga ega bo'lishi kerak

6. **Kurs nomi allaqachon mavjud**: Kurs nomlari noyob bo'lishi kerak

7. **Yangilash uchun maydonlar berilmagan**: Kurs yangilanganda kamida bitta maydon ko'rsatilishi kerak

8. **Kurs topilmadi**: `courseId` mavjudligini tekshiring

9. **Noto'g'ri kurs ID**: Kurs ID haqiqiy raqam bo'lishi kerak

10. **Yozilish topilmadi**: Talabani o'chirganda, talaba haqiqatan ham kursga yozilganligini tekshiring

11. **Talaba allaqachon o'chirilgan**: Kursdan allaqachon o'chirilgan talabani o'chirib bo'lmaydi

### Kurs Yangilashga Oid Maxsus Eslatmalar

- `updateCourse`'dagi barcha maydonlar ixtiyoriy - siz faqat o'zgartirmoqchi bo'lgan maydonlarni yangilashingiz mumkin
- Agar `teacherId` yangilansa, o'qituvchi quyidagilarga javob berishi kerak:
  - Mavjud bo'lishi va faol bo'lishi
  - Kurs jinsi (yoki siz belgilamoqchi bo'lgan jins) bilan mos keladigan jinsga ega bo'lishi
  - `degreeIds` (agar `degreeIds` ham yangilansa) bilan mos keladigan kamida bitta darajaga ega bo'lishi
- Agar `degreeIds` yangilansa, barcha ko'rsatilgan daraja ID'lari mavjud bo'lishi kerak
- Kurs nomi noyob bo'lishi kerak (boshqa mavjud kurs nomi bilan mos kelmasligi kerak)
- Yangilash muvaffaqiyatli bo'lishi uchun kamida bitta maydon ko'rsatilishi kerak

### GraphQL Playground'da Mutation'lardan Foydalanish

GraphQL Playground'da sinash uchun siz quyidagilarni bajarishingiz kerak:

1. **Avval tizimga kiring** token olish uchun:
```graphql
mutation Login {
  login(username: "admin.username", password: "your-password") {
    token
  }
}
```

2. **Playground'da Authorization header'ini o'rnating**:
   - Playground'ning pastki qismida "HTTP HEADERS"ni bosing
   - Qo'shing: `{ "Authorization": "Bearer YOUR_TOKEN_HERE" }`

3. **Keyin mutation'larni ishga tushiring** masalan `addCourse` yoki `deleteCourse`

---

# Qo'shimcha Mutation Misollari

## Profil va Parol Boshqaruvi

### Profilni Yangilash Mutation'i

**⚠️ Autentifikatsiya talab qilinadi - O'z profilini yangilash**

```graphql
mutation UpdateProfile {
  updateProfile(
    tgUsername: "yangi_telegram_username"
    phone: "998901234567"
  ) {
    success
    message
    user {
      id
      username
      fullname
      tgUsername
      phone
      role
    }
    errors
    timestamp
  }
}
```

### Parolni O'zgartirish Mutation'i

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
mutation UpdatePassword {
  updatePassword(
    currentPassword: "joriy_parol"
    newPassword: "YangiParol123"
  ) {
    success
    message
    errors
    timestamp
  }
}
```

## Adminlar Boshqaruvi

### Yangi Admin Qo'shish Mutation'i

**⚠️ ROOT roli talab qilinadi**

```graphql
mutation AddAdmin {
  addAdmin(
    username: "admin001"
    password: "SecurePass123"
    fullname: "Admin Ism Familiya"
    tgUsername: "admin_username"
    birthDate: "1990-01-15"
    phone: "998901234567"
    gender: MALE
  ) {
    success
    message
    admin {
      id
      username
      fullname
      tgUsername
      phone
      gender
      isActive
      createdAt
    }
    errors
    timestamp
  }
}
```

### Admin Profilini Yangilash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi (ADMIN faqat o'z profilini yangilashi mumkin)**

```graphql
mutation UpdateAdmin {
  updateAdmin(
    id: "1"
    fullname: "Yangilangan Ism"
    tgUsername: "yangi_telegram"
    phone: "998907654321"
    birthDate: "1990-02-20"
    isActive: true
  ) {
    success
    message
    admin {
      id
      username
      fullname
      tgUsername
      phone
      isActive
    }
    errors
    timestamp
  }
}
```

### Admin Faollik Holatini Yangilash Mutation'i

**⚠️ ROOT roli talab qilinadi**

```graphql
mutation UpdateAdminActive {
  updateAdminActive(
    adminId: "1"
    isActive: false
  ) {
    success
    message
    admin {
      id
      username
      isActive
    }
    errors
    timestamp
  }
}
```

### Adminni O'chirish Mutation'i

**⚠️ ROOT roli talab qilinadi**

```graphql
mutation DeleteAdmin {
  deleteAdmin(adminId: "1") {
    success
    message
    admin {
      id
      username
    }
    errors
    timestamp
  }
}
```

## O'qituvchilar Boshqaruvi

### Yangi O'qituvchi Qo'shish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation AddTeacher {
  addTeacher(
    username: "teacher001"
    password: "TeacherPass123"
    fullname: "O'qituvchi Ism Familiya"
    tgUsername: "teacher_username"
    birthDate: "1985-05-10"
    phone: "998901234567"
    gender: FEMALE
    degreeIds: ["1", "2"]
  ) {
    success
    message
    teacher {
      id
      username
      fullname
      tgUsername
      phone
      gender
      isActive
      degrees {
        id
        name
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

### O'qituvchi Profilini Yangilash Mutation'i

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi (TEACHER faqat o'z profilini yangilashi mumkin)**

```graphql
mutation UpdateTeacher {
  updateTeacher(
    id: "1"
    fullname: "Yangilangan Ism"
    tgUsername: "yangi_telegram"
    phone: "998907654321"
    degreeIds: ["2", "3"]
    isActive: true
  ) {
    success
    message
    teacher {
      id
      username
      fullname
      degrees {
        id
        name
      }
      isActive
    }
    errors
    timestamp
  }
}
```

### O'qituvchi Faollik Holatini Yangilash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation UpdateTeacherActive {
  updateTeacherActive(
    id: "1"
    isActive: false
  ) {
    success
    message
    teacher {
      id
      username
      isActive
    }
    errors
    timestamp
  }
}
```

### O'qituvchini O'chirish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation DeleteTeacher {
  deleteTeacher(id: "1") {
    success
    message
    teacher {
      id
      username
    }
    errors
    timestamp
  }
}
```

## Talabalar Boshqaruvi

### Yangi Talaba Qo'shish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation AddStudent {
  addStudent(
    username: "student001"
    password: "StudentPass123"
    fullname: "Talaba Ism Familiya"
    tgUsername: "student_username"
    birthDate: "2005-03-20"
    gender: MALE
    possibleDegrees: ["1", "2"]
    phone: "998901234567"
  ) {
    success
    message
    student {
      id
      username
      fullname
      tgUsername
      birthDate
      gender
      phone
      isActive
      possibleDegrees {
        id
        name
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

### Talaba Profilini Yangilash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation UpdateStudent {
  updateStudent(
    id: "1"
    fullname: "Yangilangan Ism"
    tgUsername: "yangi_telegram"
    phone: "998907654321"
    isActive: true
  ) {
    success
    message
    student {
      id
      username
      fullname
      isActive
    }
    errors
    timestamp
  }
}
```

### Talaba Faollik Holatini Yangilash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation UpdateStudentActive {
  updateStudentActive(
    id: "1"
    isActive: false
  ) {
    success
    message
    student {
      id
      username
      isActive
    }
    errors
    timestamp
  }
}
```

### Talabani O'chirish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation DeleteStudent {
  deleteStudent(id: "1") {
    success
    message
    student {
      id
      username
    }
    errors
    timestamp
  }
}
```

## Darajalar Boshqaruvi

### Yangi Daraja Qo'shish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation AddDegree {
  addDegree(name: "Kompyuter Fanlari") {
    success
    message
    degree {
      id
      name
      createdAt
    }
    errors
    timestamp
  }
}
```

### Darajani Yangilash Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation UpdateDegree {
  updateDegree(
    id: "1"
    name: "Yangilangan Daraja Nomi"
  ) {
    success
    message
    degree {
      id
      name
    }
    errors
    timestamp
  }
}
```

### Darajani O'chirish Mutation'i

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
mutation DeleteDegree {
  deleteDegree(id: "1") {
    success
    message
    degree {
      id
      name
    }
    errors
    timestamp
  }
}
```

## Davomat Boshqaruvi

### Davomatni Belgilash Mutation'i

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi**

```graphql
mutation SetAttendance {
  setAttendance(
    courseId: "1"
    studentId: "10"
    date: "2024-01-15"
    isPresent: true
    notes: "Darsda qatnashdi"
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
      notes
      course {
        id
        name
      }
      student {
        id
        fullname
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

### Davomatni Yo'q Deb Belgilash

```graphql
mutation SetAbsentAttendance {
  setAttendance(
    courseId: "1"
    studentId: "10"
    date: "2024-01-16"
    isPresent: false
    notes: "Sabab ko'rsatilmadi"
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
      notes
    }
    errors
    timestamp
  }
}
```

---

# GraphQL Query Misollari

## Joriy Foydalanuvchi Ma'lumotlari

### Me Query

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query Me {
  me {
    id
    username
    fullname
    role
    birthDate
    phone
    tgUsername
    isActive
    createdAt
  }
}
```

## Adminlar Query'lari

### Barcha Adminlarni Olish

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
query GetAdmins {
  getAdmins {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    isActive
    createdAt
  }
}
```

### Bitta Adminni Olish

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
query GetAdmin {
  getAdmin(id: "1") {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    isActive
    createdAt
  }
}
```

## O'qituvchilar Query'lari

### Barcha O'qituvchilarni Olish

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query GetTeachers {
  getTeachers {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    profilePicture
    isActive
    degrees {
      id
      name
    }
    createdAt
  }
}
```

### Bitta O'qituvchini Olish

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query GetTeacher {
  getTeacher(id: "1") {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    profilePicture
    isActive
    degrees {
      id
      name
    }
    createdAt
  }
}
```

## Talabalar Query'lari

### Barcha Talabalarni Olish

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
query GetStudents {
  getStudents {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    profilePicture
    isActive
    possibleDegrees {
      id
      name
    }
    createdAt
  }
}
```

### Bitta Talabani Olish

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
query GetStudent {
  getStudent(id: "1") {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    profilePicture
    isActive
    possibleDegrees {
      id
      name
    }
    createdAt
  }
}
```

## Darajalar Query'lari

### Barcha Darajalarni Olish

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query GetDegrees {
  getDegrees {
    id
    name
    createdAt
  }
}
```

### Bitta Darajani Olish

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query GetDegree {
  getDegree(id: "1") {
    id
    name
    createdAt
    teachers {
      id
      fullname
    }
    courses {
      id
      name
    }
  }
}
```

## Kurslar Query'lari

### Barcha Kurslarni Olish

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query GetCourses {
  getCourses {
    id
    name
    description
    daysOfWeek
    gender
    startAt
    endAt
    startTime
    endTime
    teacher {
      id
      fullname
      username
    }
    degrees {
      id
      name
    }
    students {
      id
      student {
        id
        fullname
      }
      monthlyPayment
      isActive
    }
    createdAt
  }
}
```

### Bitta Kursni Olish

**⚠️ Autentifikatsiya talab qilinadi**

```graphql
query GetCourse {
  getCourse(id: "1") {
    id
    name
    description
    daysOfWeek
    gender
    startAt
    endAt
    startTime
    endTime
    teacher {
      id
      fullname
      username
    }
    degrees {
      id
      name
    }
    students {
      id
      student {
        id
        fullname
      }
      monthlyPayment
      joinedAt
      isActive
    }
    createdAt
  }
}
```

## Davomat Query'lari

### Barcha Davomatlarni Olish

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi**

```graphql
query GetAttendances {
  getAttendances {
    id
    date
    isPresent
    notes
    course {
      id
      name
    }
    student {
      id
      fullname
      username
    }
    createdAt
  }
}
```

### Kurs Bo'yicha Davomatlarni Olish

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi**

```graphql
query GetAttendancesByCourse {
  getAttendances(courseId: "1") {
    id
    date
    isPresent
    notes
    student {
      id
      fullname
    }
  }
}
```

### Talaba Bo'yicha Davomatlarni Olish

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi**

```graphql
query GetAttendancesByStudent {
  getAttendances(studentId: "1") {
    id
    date
    isPresent
    notes
    course {
      id
      name
    }
  }
}
```

### Sana Oralig'i Bo'yicha Davomatlarni Olish

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi**

```graphql
query GetAttendancesByDateRange {
  getAttendances(
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  ) {
    id
    date
    isPresent
    notes
    course {
      id
      name
    }
    student {
      id
      fullname
    }
  }
}
```

### Barcha Filtrlash bilan Davomatlarni Olish

**⚠️ ROOT, ADMIN yoki TEACHER roli talab qilinadi**

```graphql
query GetFilteredAttendances {
  getAttendances(
    courseId: "1"
    studentId: "10"
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  ) {
    id
    date
    isPresent
    notes
    course {
      id
      name
    }
    student {
      id
      fullname
    }
    createdAt
  }
}
```

## Dashboard Statistikasi

### Dashboard Statistikasini Olish

**⚠️ ROOT yoki ADMIN roli talab qilinadi**

```graphql
query GetDashboardStats {
  getDashboardStats {
    totalStudents
    totalTeachers
    totalAdmins
    activeStudents
    activeTeachers
    activeAdmins
    totalUsers
    activeUsers
    averageStudentAge
    averageTeacherAge
    averageAdminAge
    studentGenderDistribution {
      male
      female
      child
    }
    teacherGenderDistribution {
      male
      female
      child
    }
  }
}
```

---

# Qo'shimcha Eslatmalar

## Mutation'larda Ruxsatlar

### ROOT foydalanuvchisi:
- Barcha mutation'larni bajarishi mumkin
- Barcha query'larni ko'ra oladi

### ADMIN foydalanuvchisi:
- Faqat o'z jinsidagi resurslarni boshqarishi mumkin (CHILD bundan mustasno)
- O'z profilini yangilashi mumkin
- Adminlarni faqat ko'ra oladi (yaratish/o'chirish ROOT uchun)

### TEACHER foydalanuvchisi:
- Faqat o'z profilini yangilashi mumkin
- O'z jinsidagi kurslar uchun davomat belgilashi mumkin
- Talabalarni boshqara olmaydi

## Umumiy Xatolar (Qo'shimcha)

12. **Telegram username noto'g'ri format**: Telegram username faqat harflar, raqamlar va underscore qabul qiladi (5-32 belgi)

13. **Telefon raqami noto'g'ri format**: Telefon raqami 8-17 raqamdan iborat bo'lishi kerak

14. **Tug'ilgan sana kelajakda**: Tug'ilgan sana kelajakda bo'lishi mumkin emas

15. **Username allaqachon mavjud**: Username boshqa foydalanuvchi tomonidan ishlatilmoqda

16. **Parol talablarga javob bermaydi**: Parol kamida 8 belgidan iborat bo'lishi, katta va kichik harf, raqamni o'z ichiga olishi kerak

17. **Daraja topilmadi**: Ko'rsatilgan daraja ID'lari mavjud emas

18. **O'qituvchi darajaga ega emas**: O'qituvchi ko'rsatilgan darajaga ega emas

19. **Davomat allaqachon mavjud**: Bu sana va kurs uchun davomat allaqachon belgilangan

## Telefon Raqami Formati

- Format: Xalqaro format (masalan: `998901234567`)
- Normalizatsiya: Barcha belgilar (bo'shliqlar, tirelar, qavslar) olib tashlanadi
- Uzunlik: 8-17 raqam

## Telegram Username Formati

- Format: Faqat harflar, raqamlar va underscore (`_`)
- Uzunlik: 5-32 belgi
- Normalizatsiya: `@` belgisi avtomatik olib tashlanadi
- Masalan: `@username` → `username`

## Profil Rasm Yuklash

Ba'zi mutation'larda profil rasmi yuklash mumkin:
- `addTeacher`
- `updateTeacher`
- `addStudent`
- `updateStudent`

Bu fayl `Upload` scalar tipidan foydalanadi va multipart/form-data orqali yuborilishi kerak.
