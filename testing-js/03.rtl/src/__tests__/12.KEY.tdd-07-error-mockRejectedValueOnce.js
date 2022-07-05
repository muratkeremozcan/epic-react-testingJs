import * as React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {build, fake, sequence} from 'test-data-bot'
import {Redirect as MockRedirect} from 'react-router'
import {savePost as mockSavePost} from '../api'
import {Editor} from '../post-editor-07-error-state'

// problem: if the savePost api call failed, we wouldn't have any idea what went wrong

jest.mock('react-router', () => {
  return {
    Redirect: jest.fn(() => null),
  }
})
jest.mock('../api')
afterEach(jest.clearAllMocks)

const postBuilder = build('Post').fields({
  title: fake((f) => f.lorem.words()),
  content: fake((f) => f.lorem.paragraphs().replace(/\r/g, '')),
  tags: fake((f) => [f.lorem.word(), f.lorem.word(), f.lorem.word()]),
})

const userBuilder = build('User').fields({
  id: sequence((s) => `user-${s}`),
})

test('renders a form with title, content, tags, and a submit button', async () => {
  mockSavePost.mockResolvedValueOnce()
  // Arrange
  const fakeUser = userBuilder()
  render(<Editor user={fakeUser} />)
  const preDate = new Date().getTime()

  // Act
  const fakePost = postBuilder()
  screen.getByLabelText(/title/i).value = fakePost.title
  screen.getByLabelText(/content/i).value = fakePost.content
  screen.getByLabelText(/tags/i).value = fakePost.tags.join(', ')
  const submitButton = screen.getByText(/submit/i)

  userEvent.click(submitButton)

  // Assert
  expect(submitButton).toBeDisabled()
  expect(mockSavePost).toHaveBeenCalledTimes(1)
  expect(mockSavePost).toHaveBeenCalledWith({
    ...fakePost,
    date: expect.any(String),
    authorId: fakeUser.id,
  })

  const date = new Date(mockSavePost.mock.calls[0][0].date).getTime()
  const postDate = new Date().getTime()
  expect(date).toBeGreaterThanOrEqual(preDate)
  expect(date).toBeLessThanOrEqual(postDate)

  await waitFor(() => expect(MockRedirect).toHaveBeenCalledWith({to: '/'}, {}))
})

test('renders an error message from the server', async () => {
  const testError = 'test error'

  // (1) mock an error case
  mockSavePost.mockRejectedValueOnce({data: {error: testError}})
  // Arrange
  const fakeUser = userBuilder()
  render(<Editor user={fakeUser} />)

  // Act
  const submitButton = screen.getByText(/submit/i)
  userEvent.click(submitButton)

  // Assert
  // findBy queries are async, they continue to query DOM as changes are made
  const postError = await screen.findByRole('alert')
  expect(postError).toHaveTextContent(testError)
  expect(submitButton).toBeEnabled()
})
