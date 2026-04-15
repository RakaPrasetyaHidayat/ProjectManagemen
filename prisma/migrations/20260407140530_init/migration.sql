-- CreateEnum
CREATE TYPE "users_role" AS ENUM ('manager', 'staf');

-- CreateEnum
CREATE TYPE "users_status" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "tasks_task_status" AS ENUM ('To_Do', 'On_Progress', 'Done');

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "project_name" VARCHAR(250) NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_files" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "file_name" VARCHAR(250) NOT NULL,
    "file_path" VARCHAR(250) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "task_name" VARCHAR(250),
    "task_status" "tasks_task_status",
    "task_assign" INTEGER,
    "task_project" INTEGER,
    "deadline" TIMESTAMP(3),
    "file" VARCHAR(250),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(250) NOT NULL,
    "role" "users_role" NOT NULL DEFAULT 'staf',
    "password" VARCHAR(250) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" "users_status" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "actor" VARCHAR(250) NOT NULL,
    "action" VARCHAR(250) NOT NULL,
    "target" VARCHAR(250) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "created_by" ON "project"("created_by");

-- CreateIndex
CREATE INDEX "task_id" ON "task_files"("task_id");

-- CreateIndex
CREATE INDEX "fk_project" ON "tasks"("task_project");

-- CreateIndex
CREATE INDEX "task_assign" ON "tasks"("task_assign");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_project_fkey" FOREIGN KEY ("task_project") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_assign_fkey" FOREIGN KEY ("task_assign") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
