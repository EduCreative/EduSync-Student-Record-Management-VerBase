-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name character varying,
  user_avatar text,
  school_id uuid,
  action text NOT NULL,
  details text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT activity_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id text,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid,
  school_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  sort_order integer,
  section text DEFAULT ''::text,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id),
  CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.fee_challans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challan_number character varying NOT NULL UNIQUE,
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  month character varying NOT NULL,
  year integer NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL,
  fee_items jsonb NOT NULL,
  previous_balance numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  discount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  paid_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_history jsonb DEFAULT '[]'::jsonb,
  fine_amount numeric DEFAULT 0,
  CONSTRAINT fee_challans_pkey PRIMARY KEY (id),
  CONSTRAINT fee_challans_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT fee_challans_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.fee_heads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  default_amount numeric NOT NULL,
  school_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fee_heads_pkey PRIMARY KEY (id),
  CONSTRAINT fee_heads_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL,
  role text NOT NULL,
  school_id uuid,
  status text NOT NULL DEFAULT 'Pending Approval'::text,
  avatar_url text,
  last_login timestamp with time zone,
  child_student_ids ARRAY,
  disabled_nav_links ARRAY,
  permissions_overrides jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  exam character varying NOT NULL,
  subject character varying NOT NULL,
  marks numeric NOT NULL,
  total_marks numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id text,
  CONSTRAINT results_pkey PRIMARY KEY (id),
  CONSTRAINT results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT results_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.school_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  description text,
  school_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_events_pkey PRIMARY KEY (id),
  CONSTRAINT school_events_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  class_id uuid,
  school_id uuid NOT NULL,
  roll_number text NOT NULL,
  father_name text NOT NULL,
  date_of_birth date,
  date_of_admission date,
  contact_number text,
  address text,
  status text DEFAULT 'Active'::text,
  gender text,
  created_at timestamp with time zone DEFAULT now(),
  admitted_class text,
  caste text,
  last_school_attended text,
  opening_balance numeric DEFAULT '0'::numeric,
  fee_structure jsonb,
  avatar_url text,
  father_cnic text,
  secondary_contact_number text,
  gr_number text,
  religion text,
  place_of_birth text,
  progress text,
  date_of_leaving date,
  reason_for_leaving text,
  conduct text,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);