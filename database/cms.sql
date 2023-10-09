USE SRMS;

-- Create admin table
CREATE TABLE IF NOT EXISTS admin (
    admin_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    resetLink VARCHAR(255) DEFAULT '',
    PRIMARY KEY(admin_id)
);

-- Create department table
CREATE TABLE IF NOT EXISTS department (
    dept_id VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
    d_name VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (dept_id)
);

-- Create course table
CREATE TABLE IF NOT EXISTS course (
    c_id VARCHAR(255)  UNIQUE,
    semester INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    c_type VARCHAR(255) NOT NULL,
    credits INT NOT NULL,
    dept_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (c_id),
    CONSTRAINT course_fk0 FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create student table
-- Create student table
CREATE TABLE IF NOT EXISTS student (
    s_id VARCHAR(36) UNIQUE,
    rollNumber INT NOT NULL UNIQUE,
    s_name VARCHAR(255) NOT NULL,
    gender VARCHAR(6) NOT NULL,
    dob DATE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    s_address VARCHAR(255) NOT NULL,
    contact VARCHAR(12) NOT NULL,
    password VARCHAR(255) NOT NULL,
    section INT NOT NULL,
    joining_date DATE,
    dept_id VARCHAR(255),
    resetLink VARCHAR(255) DEFAULT '',
    PRIMARY KEY(s_id),
    CONSTRAINT student_fk0 FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON UPDATE CASCADE ON DELETE RESTRICT
);



-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
    st_id VARCHAR(36) NOT NULL,
    st_name VARCHAR(255) NOT NULL,
    gender VARCHAR(6) NOT NULL,
    dob DATE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    st_address VARCHAR(255) NOT NULL,
    contact VARCHAR(12) NOT NULL,
    dept_id VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    resetLink VARCHAR(255) DEFAULT '',
    PRIMARY KEY (st_id),
    CONSTRAINT staff_fk0 FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON UPDATE CASCADE ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS class (
    class_id INT NOT NULL AUTO_INCREMENT UNIQUE,
    section INT NOT NULL,
    semester INT NOT NULL,
    year TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    c_id VARCHAR(100),
    st_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (class_id),
    CONSTRAINT class_fk0 FOREIGN KEY (c_id) REFERENCES course(c_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT class_fk1 FOREIGN KEY (st_id) REFERENCES staff(st_id) ON UPDATE CASCADE ON DELETE RESTRICT
);


-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    s_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    c_id VARCHAR(100) NOT NULL,
    status TINYINT(1) DEFAULT NULL,
    PRIMARY KEY (s_id, c_id, date),
    CONSTRAINT attendance_fk0 FOREIGN KEY (s_id) REFERENCES student(s_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT attendance_fk1 FOREIGN KEY (c_id) REFERENCES course(c_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create result table
CREATE TABLE IF NOT EXISTS result (
    result_id INT NOT NULL AUTO_INCREMENT UNIQUE,
    semester INT NOT NULL,
    s_id VARCHAR(36) ,
    rollNumber INT NOT NULL,
    dept_id VARCHAR(255) NOT NULL,
    c_id VARCHAR(100) NOT NULL,
    marks DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (result_id),
    CONSTRAINT result_fk0 FOREIGN KEY (s_id) REFERENCES student(s_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT result_fk1 FOREIGN KEY (c_id) REFERENCES course(c_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT result_fk2 FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON UPDATE CASCADE ON DELETE RESTRICT
);
