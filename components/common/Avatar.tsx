import React from 'react';
import { User, Student } from '../../types';

interface AvatarProps {
    user?: User | null;
    student?: Student | null;
    className?: string;
}

const isStudent = (person: User | Student): person is Student => {
    return 'gender' in person;
};

const Avatar: React.FC<AvatarProps> = ({ user, student, className = 'h-10 w-10' }) => {
    const person = user || student;

    if (person?.avatarUrl) {
        return <img src={person.avatarUrl} alt={person.name} className={`${className} rounded-full object-cover`} />;
    }
    
    // Determine the correct placeholder. Default to the generic (male) one for non-students.
    const placeholder = (person && isStudent(person)) 
        ? (person.gender === 'Female' ? <FemaleGraduatePlaceholder /> : <MaleGraduatePlaceholder />)
        : <MaleGraduatePlaceholder />;

    return (
        <div className={`${className} rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center overflow-hidden text-secondary-500`}>
           {placeholder}
        </div>
    );
};

// A clean, faceless silhouette of a graduate.
const MaleGraduatePlaceholder: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full p-2.5">
      <path d="M12,3L1,9L12,15L23,9L12,3Z M5,10.2L12,13.8L19,10.2L12,6.6L5,10.2Z M5,15.2V12.8L12,16.4L19,12.8V15.2L12,18.8L5,15.2Z" />
      <path d="M6,19.2C6,17.4,8.7,16,12,16C15.3,16,18,17.4,18,19.2V21H6V19.2Z" />
    </svg>
);

// A similar silhouette, with a slightly different shoulder/hair line to indicate a female form.
const FemaleGraduatePlaceholder: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full p-2.5">
      <path d="M12,3L1,9L12,15L23,9L12,3Z M5,10.2L12,13.8L19,10.2L12,6.6L5,10.2Z M5,15.2V12.8L12,16.4L19,12.8V15.2L12,18.8L5,15.2Z" />
      <path d="M6,21V19.2C6,17.4,8.7,16,12,16C15.3,16,18,17.4,18,19.2V21H6Z M8,15.2C7.2,15.2,6.5,14.5,6.5,13.7C6.5,12.9,7.2,12.2,8,12.2C8.8,12.2,9.5,12.9,9.5,13.7C9.5,14.5,8.8,15.2,8,15.2Z M16,15.2C15.2,15.2,14.5,14.5,14.5,13.7C14.5,12.9,15.2,12.2,16,12.2C16.8,12.2,17.5,12.9,17.5,13.7C17.5,14.5,16.8,15.2,16,15.2Z"/>
    </svg>
);


export default Avatar;
