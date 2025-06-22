/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useMemo } from 'react';
import { useRef, createRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { UserWarning } from './UserWarning';
import { USER_ID, getTodos } from './api/todos';
import { Todo } from './types/Todo';
import { TodoItem } from './components/TodoItem';

type FilterStatus = 'all' | 'active' | 'completed';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterBy, setFilterBy] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);

  // cria referencia para o input de criação de nova todo
  // e para cada todo da lista em TransitionGroup. Refs evita mensagem de erro no console
  // new Map() cria um objeto Map que armazena pares chave/valor, por enquanto vazio
  const newTodoFieldRef = useRef<HTMLInputElement>(null);
  const nodeRefs = useRef(new Map());

  useEffect(() => {
    // Verifica se a Ref foi anexada ao elemento (não é null) e aplica o focus
    if (newTodoFieldRef.current) {
      newTodoFieldRef.current.focus();
    }
  }, []);

  useEffect(() => {
    getTodos()
      .then(initialTodos => {
        setTodos(initialTodos);
      })
      .catch(() => {
        setErrorMessage('Unable to load todos');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // limpa mensagem de erro, se existir
  useEffect(() => {
    if (errorMessage) {
      const timerId = setTimeout(() => {
        setErrorMessage('');
      }, 3000);

      return () => clearTimeout(timerId);
    }

    return undefined;
  }, [errorMessage]);

  // filtra por active, completed, all (default)
  const visibleTodos = useMemo(() => {
    return todos.filter(todo => {
      switch (filterBy) {
        case 'active':
          return !todo.completed;
        case 'completed':
          return todo.completed;
        default:
          return true;
      }
    });
  }, [todos, filterBy]);

  const activeTodosCount = useMemo(() => {
    return todos.filter(todo => !todo.completed).length;
  }, [todos]);

  const allTodosCompleted = useMemo(() => {
    return todos.length > 0 && todos.every(todo => todo.completed);
  }, [todos]);

  const handleToggleTodo = (todoId: number) => {
    setTodos(currentTodos =>
      currentTodos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterBy(status);
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className={`todoapp__toggle-all ${allTodosCompleted ? 'active' : ''}`}
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form>
            <input
              ref={newTodoFieldRef}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {isLoading && (
            <div className="todoapp__main__loading">
              <span className="todoapp__main__loading-spinner loader"></span>
              <p className="todoapp__main__loading-text">Loading todos...</p>
            </div>
          )}
          <TransitionGroup>
            {visibleTodos.map(todo => {
              // Se o todo.id ainda não existe no Map, cria uma nova ref e adiciona
              // Se já existe, reutiliza a ref existente
              if (!nodeRefs.current.has(todo.id)) {
                nodeRefs.current.set(todo.id, createRef<HTMLDivElement>());
              }

              // Pega a ref correspondente ao todo.id
              // o ! no final indica que a ref já existe com certeza,
              // porque foi criada no passo anterior se nao existia
              // O ! é o non-null assertion operator do TypeScript
              const nodeRef = nodeRefs.current.get(todo.id)!;

              return (
                <CSSTransition
                  key={todo.id}
                  nodeRef={nodeRef}
                  timeout={300}
                  classNames="item"
                >
                  <div ref={nodeRef}>
                    <TodoItem todo={todo} onToggle={handleToggleTodo} />
                  </div>
                </CSSTransition>
              );
            })}
          </TransitionGroup>
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${activeTodosCount} item${activeTodosCount !== 1 ? 's' : ''} left`}
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${filterBy === 'all' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={e => {
                  e.preventDefault();
                  handleFilterChange('all');
                }}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${filterBy === 'active' ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={e => {
                  e.preventDefault();
                  handleFilterChange('active');
                }}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${filterBy === 'completed' ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={e => {
                  e.preventDefault();
                  handleFilterChange('completed');
                }}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`
          notification is-danger is-light has-text-weight-normal ${!errorMessage ? 'hidden' : ''}
          `}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {/* show only one message at a time */}
        {errorMessage}
      </div>
    </div>
  );
};
