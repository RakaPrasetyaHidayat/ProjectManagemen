-- AlterTable
ALTER TABLE "task_files" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "created_by" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_files" (
    "id" SERIAL NOT NULL,
    "note_id" INTEGER NOT NULL,
    "file_name" VARCHAR(250) NOT NULL,
    "file_path" VARCHAR(250) NOT NULL,
    "uploaded_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_created_by" ON "notes"("created_by");

-- CreateIndex
CREATE INDEX "note_file_note_id" ON "note_files"("note_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_files" ADD CONSTRAINT "note_files_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
