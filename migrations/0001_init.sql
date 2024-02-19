CREATE TABLE todos (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0
);

INSERT INTO todos (text, done)
VALUES
    ('Buy groceries', 0),
    ('Read a book', 1),
    ('Take out the trash', 0),
    ('Do laundry', 1),
    ('Go for a run', 0);
