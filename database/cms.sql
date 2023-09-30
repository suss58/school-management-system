USE cumsdbms;

-- Create admin table
CREATE TABLE IF NOT EXISTS `admin` (
    `admin_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `resetLink` VARCHAR(255) DEFAULT '',
    PRIMARY KEY(`admin_id`)
);

-- Create course table
CREATE TABLE IF NOT EXISTS `course` (
    `c_id` VARCHAR(100) NOT NULL UNIQUE,
    `semester` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `c_type` VARCHAR(255) NOT NULL,
    `credits` INT NOT NULL,
    `dept_id` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`c_id`),
    CONSTRAINT `course_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create student table
CREATE TABLE IF NOT EXISTS `student` (
    `s_id` VARCHAR(36) NOT NULL,
    `s_name` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(6) NOT NULL,
    `dob` DATE NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `s_address` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(12) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `section` INT NOT NULL,
    `joining_date` DATE,
    `dept_id` VARCHAR(255),
    `resetLink` VARCHAR(255) DEFAULT '',
    PRIMARY KEY (`s_id`),
    CONSTRAINT `student_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Set default value for joining_date
ALTER TABLE `student`
ALTER COLUMN `joining_date` SET DEFAULT CURRENT_DATE;




-- Create staff table
CREATE TABLE IF NOT EXISTS `staff` (
    `st_id` VARCHAR(36) NOT NULL,
    `st_name` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(6) NOT NULL,
    `dob` DATE NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `st_address` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(12) NOT NULL,
    `dept_id` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `resetLink` VARCHAR(255) DEFAULT '',
    PRIMARY KEY (`st_id`),
    CONSTRAINT `staff_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create department table
CREATE TABLE IF NOT EXISTS `department` (
    `dept_id` VARCHAR(255) NOT NULL UNIQUE,
    `d_name` VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (`dept_id`)
);

-- Create fee table
CREATE TABLE IF NOT EXISTS `fee` (
    `fee_id` INT NOT NULL AUTO_INCREMENT UNIQUE,
    `fee_type` VARCHAR(255) NOT NULL,
    `receipt_no` BINARY NOT NULL,
    `date` DATE NOT NULL UNIQUE,
    `s_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`fee_id`),
    CONSTRAINT `fee_fk0` FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create class table
CREATE TABLE IF NOT EXISTS `class` (
    `class_id` INT NOT NULL AUTO_INCREMENT UNIQUE,
    `section` INT NOT NULL,
    `semester` INT NOT NULL,
    `year` DATE DEFAULT CURRENT_DATE,
    `c_id` VARCHAR(100),
    `st_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`class_id`),
    CONSTRAINT `class_fk0` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `class_fk1` FOREIGN KEY (`st_id`) REFERENCES `staff`(`st_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);


-- Create assignment table
CREATE TABLE IF NOT EXISTS `assignment` (
    `asg_id` INT NOT NULL AUTO_INCREMENT,
    `day` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `deadline` DATETIME NOT NULL,
    `class_id` INT NOT NULL,
    PRIMARY KEY (`asg_id`),
    CONSTRAINT `assignment_fk0` FOREIGN KEY (`class_id`) REFERENCES `class`(`class_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS `attendance` (
    `s_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `c_id` VARCHAR(100) NOT NULL,
    `status` BOOLEAN DEFAULT NULL,
    PRIMARY KEY (`s_id`, `c_id`, `date`),
    CONSTRAINT `attendance_fk0` FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `attendance_fk1` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create marks table
CREATE TABLE IF NOT EXISTS `marks` (
    `test_id` INT NOT NULL AUTO_INCREMENT,
    `tt_marks` INT,
    `ob_marks` INT,
    `test_type` INT,
    `s_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`test_id`)
);

-- Create assignment_submission table
CREATE TABLE IF NOT EXISTS `assignment_submission` (
    `s_id` VARCHAR(36) NOT NULL,
    `asg_id` INT NOT NULL,
    PRIMARY KEY (`s_id`, `asg_id`),
    CONSTRAINT `assignment_submission_fk0` FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `assignment_submission_fk1` FOREIGN KEY (`asg_id`) REFERENCES `assignment`(`asg_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create time_table table
CREATE TABLE IF NOT EXISTS `time_table` (
    `c_id` VARCHAR(100),
    `st_id` VARCHAR(36) NOT NULL,
    `section` INT NOT NULL,
    `day` INT NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    PRIMARY KEY (`c_id`, `section`, `day`),
    CONSTRAINT `time_table_fk0` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `time_table_fk1` FOREIGN KEY (`st_id`) REFERENCES `staff`(`st_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
